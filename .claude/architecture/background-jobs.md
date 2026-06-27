# Background Jobs

> Durable async work runs on **Inngest** (serverless-friendly, no always-on workers). Functions are defined in `services/api` and triggered by **events** (from tRPC mutations / webhooks) or **cron schedules**. Inngest gives us **durability, automatic retries with backoff, step memoization, concurrency/throttling controls, and idempotency** out of the box — which is why it's chosen over BullMQ (needs always-on workers + Redis ops) or bare cron (no durability).

## 1. Why Inngest

- **Event-driven + scheduled** in one model; functions subscribe to events or crons.
- **Steps are memoized** — a function is a sequence of `step.run(...)` units; on retry, completed steps aren't re-executed (critical for not double-charging or double-posting).
- **Built-in retries** with exponential backoff per step; failures are observable.
- **Concurrency, throttling, debounce, rate-limit, and idempotency keys** are first-class — important for Meta Graph and payment rate limits, and for collapsing bursty triggers.
- **Serverless** — runs alongside the Hono API on Fly/Railway; no separate worker fleet.

## 2. Function catalog

| Function | Trigger | Purpose |
|---|---|---|
| `social-auto-reply` | event `inbox/message.received` | Generate & send an AI auto-reply to inbound FB/IG messages (T3+) |
| `ai-scheduled-insights` | cron (per-org daily/weekly) | Generate finance/performance insights with Claude, notify owner |
| `social-sync` | cron (every N min) + event `social/connected` | Pull FB/IG conversations & messages via Meta Graph into our DB |
| `order-confirmation` | event `order/confirmed` | Send order confirmation to the customer; record follow-ups |
| `subscription-billing` | cron (near `current_period_end`) | Recurring BDT charge attempts + dunning state transitions |
| `scheduled-post` | event `calendar/post.scheduled` (delayed) | Publish a scheduled social post at its due time |

All functions are **org-scoped** — every event payload carries `orgId`, and every DB access runs with the service role but re-validates `org_id`.

## 3. Triggers, retries, idempotency — the patterns

### Event from a tRPC mutation
```ts
// services/api/src/routers/orders.ts (excerpt)
await inngest.send({ name: "order/confirmed", data: { orgId, orderId: order.id } });
```

### Function definition (order confirmation)
```ts
// services/api/src/inngest/order-confirmation.ts
export const orderConfirmation = inngest.createFunction(
  {
    id: "order-confirmation",
    retries: 4,                                   // exponential backoff between attempts
    idempotency: "event.data.orderId",            // one confirmation per order, ever
    concurrency: { limit: 20 },
  },
  { event: "order/confirmed" },
  async ({ event, step }) => {
    const { orgId, orderId } = event.data;

    // Step 1: load order + customer (memoized — not re-run on later-step retry)
    const order = await step.run("load-order", () => loadOrderForOrg(orgId, orderId));
    if (!order.customer?.phone) return { skipped: "no_contact" };

    // Step 2: send confirmation (SMS + in-app). External side effect isolated in its own step.
    await step.run("notify-customer", () =>
      notify.orderConfirmed(orgId, order));        // BD SMS gateway + Supabase Realtime

    // Step 3: schedule a follow-up nudge in 24h (durable sleep)
    await step.sleep("wait-1d", "24h");
    await step.run("follow-up", () => notify.orderFollowUp(orgId, order));
    return { ok: true };
  },
);
```

**Idempotency rules:**
- Every function that causes an **external side effect** (send SMS, post to Meta, charge a card) sets an **`idempotency` key** derived from the stable domain id (`orderId`, `messageId`, `subscriptionId+period`) so duplicate events (offline-reconnect resends, webhook retries) don't double-act.
- Side effects live in their **own `step.run`** so a retry of a *later* step never repeats an *earlier* completed side effect.
- Outbound writes (e.g. recording a sent message) use **upserts on a natural key** (`uq_conv_external` for Meta threads, `database-design.md` §5) so re-runs converge.

## 4. Function details

### `social-auto-reply` (T3+ `social.auto_reply` entitlement)
- **Trigger:** `inbox/message.received` (emitted by `social-sync` when a new inbound message lands).
- **Guard:** check the org's entitlement (`social.auto_reply`) and an auto-reply on/off setting; skip otherwise.
- **Steps:** load conversation context → call **Claude** (`claude-haiku-4-5` for fast, short, on-brand replies; adaptive thinking off for latency) via the `packages/core/ai` provider → send the reply through Meta Graph → record the outbound `message` (`is_auto_reply = true`).
- **Controls:** `concurrency` + Meta rate-limit `throttle`; `idempotency: event.data.messageId` (reply once per inbound message).

### `ai-scheduled-insights`
- **Trigger:** cron per cadence (daily/weekly by tier/setting).
- **Steps:** for each org with the `finance.insights` entitlement → compute the period's finance + order aggregates (server) → call **Claude `claude-opus-4-8`** (adaptive thinking, `effort: "high"`, **streaming** + `getFinalMessage()`) to produce insights/suggestions → persist + notify owner (Resend email + in-app).
- **Controls:** `concurrency` to spread Claude load; per-org `idempotency` on `(orgId, periodKey)` so a re-run doesn't duplicate an insight.

### `social-sync`
- **Trigger:** cron (every few minutes) + `social/connected` on first connect (backfill).
- **Steps:** for each connected org → page Meta Graph for new threads/messages → **upsert** `conversations`/`messages` on natural keys → emit `inbox/message.received` for genuinely new inbound messages (drives auto-reply).
- **Controls:** Meta Graph **rate-limit + throttle**; `debounce` on `social/connected` to avoid duplicate backfills; idempotent upserts make re-sync safe.

### `order-confirmation`
- See §3 example. Idempotent per `orderId`; durable 24h follow-up via `step.sleep`.

### `subscription-billing`
- **Trigger:** cron scanning subscriptions near `current_period_end`.
- **Steps:** attempt the recurring charge (bKash/Nagad direct or SSLCommerz) → on success: extend `current_period_end`, `status = active` → on failure: `status = past_due`, set `grace_ends_at`, start **dunning** (notify owner; schedule retries during grace) → on grace expiry: downgrade to `t0` (see `subscription-system.md`).
- **Controls:** `idempotency: subscriptionId + periodKey` (never double-charge a period); retries bounded; all transitions logged (Pino → Better Stack) for audit.

### `scheduled-post`
- **Trigger:** `calendar/post.scheduled` sent with a delay (or cron that picks due posts).
- **Steps:** at due time, publish via Meta Graph → record result → notify on failure. Idempotent per scheduled-post id.

## 5. Observability & failure handling

- **Logging:** every step logs structured context (`orgId`, function id, event id) via **Pino → Better Stack**; **Sentry** captures unhandled errors with the same correlation ids.
- **Retries exhausted** → the failure is recorded and surfaced (owner notification for billing; "needs attention" for sync/auto-reply); we never silently drop.
- **Backpressure:** Upstash Redis backs rate-limits/locks where a job coordinates with the synchronous API (e.g. shared Meta Graph quota).
- **Idempotency + step memoization together** mean every function is **safe to retry** — the core durability guarantee contributors must preserve when adding new jobs: isolate side effects in steps, key them idempotently, and make outbound writes upserts.
