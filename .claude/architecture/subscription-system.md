# Subscription System

> Five tiers (**T0–T4**), one app. **Entitlements are modeled independently of billing** — the entitlements engine (`packages/core/entitlements`, see `authorization.md`) derives features from the subscription **tier + status**, while billing (SSLCommerz + bKash/Nagad direct) drives that status. This separation lets us run a **manual-collection interim** (mark-paid by hand) before automated recurring billing is live, without touching feature gating.

## 1. The five tiers

| Tier | Name | Who it's for | Headline value |
|---|---|---|---|
| **T0** | Offline Mode | Solo micro-sellers, first run | Fully-offline bookkeeping, free |
| **T1** | Starter | Small shops getting online | Cloud sync + basics + AI captions |
| **T2** | Growth | Sellers doing social commerce | Social inbox + AI copy + insights |
| **T3** | Pro | Multi-staff businesses | Auto-replies, scheduling, AI logo, team |
| **T4** | Business | Larger MSMEs / multi-outlet | Higher limits, all features, priority |

> **T0 + T1 ship first** (per the approved roadmap); T2–T4 entitlements are defined now so gating and upgrade flows exist from day one.

## 2. Entitlement map (authoritative data structure)

This is the single source of truth consumed by the engine. Booleans = feature on/off; numbers = limits (`-1` = unlimited).

```ts
// packages/core/entitlements/tiers.ts
export type Tier = "t0" | "t1" | "t2" | "t3" | "t4";

export const TIER_ENTITLEMENTS: Record<Tier, Entitlements> = {
  t0: {
    "finance.basic": true,          "finance.insights": false,
    "brand.ai_caption": false,      "brand.copywriting": false,   "brand.ai_logo": false,
    "social.inbox": false,          "social.auto_reply": false,   "social.scheduling": false,
    "orders.confirmation_flow": false,
    "members.invite": false,        "members.roles": false,
    "limits.products": 50,          "limits.members": 1,
    "sync.cloud": false,            // T0 is local-only; reconciles when it later upgrades
  },
  t1: {
    "finance.basic": true,          "finance.insights": false,
    "brand.ai_caption": true,       "brand.copywriting": false,   "brand.ai_logo": false,
    "social.inbox": false,          "social.auto_reply": false,   "social.scheduling": false,
    "orders.confirmation_flow": true,
    "members.invite": true,         "members.roles": false,
    "limits.products": 300,         "limits.members": 2,
    "sync.cloud": true,
  },
  t2: {
    "finance.basic": true,          "finance.insights": true,
    "brand.ai_caption": true,       "brand.copywriting": true,    "brand.ai_logo": false,
    "social.inbox": true,           "social.auto_reply": false,   "social.scheduling": true,
    "orders.confirmation_flow": true,
    "members.invite": true,         "members.roles": true,
    "limits.products": 2000,        "limits.members": 5,
    "sync.cloud": true,
  },
  t3: {
    "finance.basic": true,          "finance.insights": true,
    "brand.ai_caption": true,       "brand.copywriting": true,    "brand.ai_logo": true,
    "social.inbox": true,           "social.auto_reply": true,    "social.scheduling": true,
    "orders.confirmation_flow": true,
    "members.invite": true,         "members.roles": true,
    "limits.products": 10000,       "limits.members": 15,
    "sync.cloud": true,
  },
  t4: {
    "finance.basic": true,          "finance.insights": true,
    "brand.ai_caption": true,       "brand.copywriting": true,    "brand.ai_logo": true,
    "social.inbox": true,           "social.auto_reply": true,    "social.scheduling": true,
    "orders.confirmation_flow": true,
    "members.invite": true,         "members.roles": true,
    "limits.products": -1,          "limits.members": -1,
    "sync.cloud": true,
  },
};

// Resolution = base tier map, then per-org overrides (pilots/support grants), then status adjustments.
export function resolveEntitlements(tier: Tier, overrides?: Partial<Entitlements>): Entitlements {
  return { ...TIER_ENTITLEMENTS[tier], ...(overrides ?? {}) };
}
```

The `subscriptions` row (`database-design.md`) stores `tier`, `status`, `current_period_end`, `grace_ends_at`, and optional `entitlements_override` (JSONB) feeding the `overrides` argument.

## 3. Tier → effective tier by billing status

Entitlements depend on **tier + status** so paying customers don't lose access the instant a payment is late:

| `status` | Effective tier resolved | Notes |
|---|---|---|
| `active` | the paid `tier` | normal |
| `grace` | the paid `tier` (until `grace_ends_at`) | payment retrying; full access |
| `past_due` | the paid `tier` (until `grace_ends_at`) | dunning in progress |
| `cancelled` / expired | **`t0`** | downgraded to free Offline Mode; cloud data retained per policy |

The engine applies this mapping before resolving the map, so call sites only ever see the **effective** entitlements.

## 4. Upgrade flow

1. User (must be **owner** — `requireRole("owner")`) picks a tier in Settings → Billing.
2. `billing.checkout({ tier, provider })` creates a pending payment via **SSLCommerz** (cards) or **bKash/Nagad direct** (mobile money), returns a `redirectUrl` + `reference`.
3. User completes payment on the provider; provider calls our **Hono webhook** (`/webhooks/payments/:provider`).
4. Webhook verifies the signature, marks the payment captured, **sets `subscriptions.tier` and `status = active`**, sets `current_period_end`.
5. New entitlements take effect on the **next request** (server reloads context) and on the client via flag/entitlement refresh (`feature-flags.md`). **Upgrades apply immediately**; limits widen at once.

## 5. Downgrade flow

- **Voluntary downgrade / cancel:** scheduled for **period end** — the org keeps the higher tier until `current_period_end`, then drops to the target tier (or `t0` on cancel). No mid-period feature yanking.
- **On effective downgrade**, if usage exceeds the new tier's limits (e.g. 8 members but new cap is 5), the system **soft-locks** the excess: existing data is read-only/retained, but no new additions beyond the cap until the user removes some or re-upgrades. Cloud-only data is retained for a grace window even when dropping to `t0` (which is local-only) so an upgrade restores it.

## 6. Billing lifecycle, grace & dunning

```
active ──(payment fails)──► past_due ──(retry window)──► grace ──(grace_ends_at passes)──► cancelled→t0
   ▲                                                        │
   └──────────────(successful retry / manual mark-paid)─────┘
```

- **Recurring BDT charges** run via Inngest scheduled jobs (`background-jobs.md`): attempt charge near `current_period_end` through bKash/Nagad direct or SSLCommerz.
- **Dunning:** on failure → `past_due`, set `grace_ends_at` (e.g. +7 days), notify the owner (Resend email + SMS + in-app). Retry on a schedule during grace.
- **Grace:** full paid-tier access throughout; clear in-app banner with a one-tap "Pay now".
- **Expiry:** if unpaid past `grace_ends_at` → `cancelled`, effective tier becomes `t0`; data retained per retention policy.

## 7. Manual-collection interim

Before automated recurring billing is fully live (and as a permanent fallback for cash/agent collections common in BD):

- An **owner or support** can record a payment out-of-band; an admin/support action (or `billing.markPaid`, owner-restricted + audited) sets `tier` + `status = active` + `current_period_end` manually.
- The **entitlements path is identical** — because entitlements derive from tier/status, a manually-marked subscription unlocks exactly the same features as an automated one. No special-casing in gates.
- All manual changes are logged (Pino → Better Stack) with actor + reason for audit.

## 8. Invariants

- **Entitlements never read the payment provider directly** — only `tier` + `status` from the `subscriptions` row. Billing can be swapped or run manually without touching gates.
- **Tier changes are server-authoritative** and never client-merged (see `offline-sync.md` §5).
- **Adding a feature** = add an `EntitlementKey`, set it across all five tiers here, and gate it (`authorization.md`). Forgetting a tier is a type error (the `Record<Tier, Entitlements>` must be exhaustive).
