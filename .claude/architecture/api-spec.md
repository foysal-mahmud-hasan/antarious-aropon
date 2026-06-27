# API Specification (tRPC)

> The API is a **thin, typed layer on Hono + tRPC** (`services/api`). It handles business logic, 3rd-party integrations (Meta Graph, payments), AI, and job triggers — everything that is **not** plain offline-first CRUD (that goes through PowerSync). Inputs/outputs are **Zod schemas from `packages/validators`**, the single source of truth shared with client forms.

## 1. Why tRPC over Hono (not REST/GraphQL)

- **End-to-end types with zero codegen** — the client imports `AppRouter` as a *type only* (`packages/api`), so a procedure signature change is a compile error on the client.
- **Hono** is the HTTP runtime (edge-friendly, fast, runs on Fly/Railway) hosting the tRPC handler plus webhook routes (payment callbacks, Meta webhooks) that aren't tRPC.
- **Rejected:** REST (manual types + docs drift), GraphQL (schema/resolver overhead we don't need for a single first-party client).

## 2. Router structure

```
appRouter
├── auth          # OTP request/verify, session, account→org bootstrap
├── org           # create/switch org, members, roles, invites
├── finance       # transactions, summaries, AI insights
├── brandStudio   # AI captions, copywriting, AI logo generation
├── social        # Meta (FB/IG) connect; inbox conversations/messages; replies
├── orders        # order lifecycle, items, confirmation flows
├── calendar      # scheduled posts / reminders / content calendar
├── ai            # low-level provider passthrough (captions/copy/insights)
└── billing       # subscription tier, checkout, entitlements
```

Each router is a noun; procedures are verbs. Mutations that mutate offline-first tables are rare here — most CRUD is local (SQLite/PowerSync); tRPC mutations are for **server-authoritative** actions.

## 3. Context, middleware & procedure types

```ts
// services/api/src/trpc.ts
export type Context = {
  userId: string | null;          // from verified Supabase JWT
  orgId: string | null;           // active org (header: x-aropon-org)
  role: "owner" | "manager" | "staff" | null;
  entitlements: Entitlements;     // resolved from subscription tier (see subscription-system.md)
};

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

// Requires an active org membership; loads role + entitlements into ctx.
const inOrg = isAuthed.unstable_pipe(({ ctx, next }) => {
  if (!ctx.orgId || !ctx.role) throw new TRPCError({ code: "FORBIDDEN", message: "NO_ACTIVE_ORG" });
  return next();
});

export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
export const orgProcedure = t.procedure.use(inOrg);

// Gate a procedure on a role and/or an entitlement (server-enforced; mirrors <TierGate>)
export const requireRole = (min: Role) => orgProcedure.use(({ ctx, next }) => {
  if (!roleAtLeast(ctx.role, min)) throw new TRPCError({ code: "FORBIDDEN", message: "ROLE_REQUIRED" });
  return next();
});
export const requireEntitlement = (key: EntitlementKey) => orgProcedure.use(({ ctx, next }) => {
  if (!ctx.entitlements[key]) throw new TRPCError({ code: "FORBIDDEN", message: `ENTITLEMENT_REQUIRED:${key}` });
  return next();
});
```

## 4. Example procedures (Zod in / Zod out)

All schemas live in `packages/validators` and are imported on both ends.

### `auth.requestOtp` / `auth.verifyOtp`
```ts
// packages/validators/auth.ts
export const requestOtpInput = z.object({ phone: z.string().regex(/^\+8801\d{9}$/) });
export const verifyOtpInput  = z.object({ phone: z.string(), code: z.string().length(6) });
export const sessionOutput   = z.object({ accessToken: z.string(), refreshToken: z.string(), userId: z.string().uuid(), isNewUser: z.boolean() });

// services/api/src/routers/auth.ts
requestOtp: publicProcedure.input(requestOtpInput).output(z.object({ sent: z.boolean() }))
  .mutation(async ({ input }) => supabase.auth.signInWithOtp({ phone: input.phone })),

verifyOtp: publicProcedure.input(verifyOtpInput).output(sessionOutput)
  .mutation(async ({ input }) => verifyOtpAndBootstrap(input)),  // see auth.md §6
```

### `orders.create` (server-authoritative confirmation path)
```ts
export const createOrderInput = z.object({
  id: z.string().uuid(),                          // client-generated (offline-safe)
  customerId: z.string().uuid().nullable(),
  items: z.array(z.object({
    productId: z.string().uuid(), qty: z.number().int().positive(), unitPriceMinor: z.number().int().nonnegative(),
  })).min(1),
});
export const orderOutput = z.object({ id: z.string().uuid(), status: z.enum(["draft","confirmed","fulfilled","cancelled"]), totalMinor: z.number().int() });

create: orgProcedure.input(createOrderInput).output(orderOutput)
  .mutation(async ({ ctx, input }) => {
    const totalMinor = input.items.reduce((s, i) => s + i.qty * i.unitPriceMinor, 0);
    const order = await db.insertOrder({ ...input, orgId: ctx.orgId, status: "confirmed", totalMinor });
    await inngest.send({ name: "order/confirmed", data: { orgId: ctx.orgId, orderId: order.id } }); // triggers confirmation flow
    return order;
  }),
```

### `finance.summary` (server-computed, cached)
```ts
export const summaryInput  = z.object({ from: z.string().datetime(), to: z.string().datetime() });
export const summaryOutput = z.object({ incomeMinor: z.number().int(), expenseMinor: z.number().int(), netMinor: z.number().int(), byCategory: z.record(z.number().int()) });

summary: orgProcedure.input(summaryInput).output(summaryOutput)
  .query(async ({ ctx, input }) => cached(`fin:${ctx.orgId}:${input.from}:${input.to}`, () => computeSummary(ctx.orgId, input))),
```

### `ai.caption` (entitlement-gated AI)
```ts
export const captionInput  = z.object({ productId: z.string().uuid(), tone: z.enum(["fun","formal","sales"]).default("sales"), lang: z.enum(["bn","en"]).default("bn") });
export const captionOutput = z.object({ text: z.string(), model: z.string() });

caption: requireEntitlement("brand.ai_caption").input(captionInput).output(captionOutput)
  .mutation(async ({ ctx, input }) => aiProvider.caption(ctx.orgId, input)),  // uses claude-haiku-4-5 for short captions
```

### `billing.checkout` (start a subscription payment)
```ts
export const checkoutInput  = z.object({ tier: z.enum(["t1","t2","t3","t4"]), provider: z.enum(["sslcommerz","bkash","nagad"]) });
export const checkoutOutput = z.object({ redirectUrl: z.string().url(), reference: z.string() });

checkout: requireRole("owner").input(checkoutInput).output(checkoutOutput)
  .mutation(async ({ ctx, input }) => startSubscriptionCheckout(ctx.orgId, input)),  // see subscription-system.md
```

## 5. AI procedures — provider & models

The `ai` and `brandStudio` routers call the provider interface in `packages/core/ai` (server-only). Model selection by workload:

| Procedure | Model | Notes |
|---|---|---|
| `ai.caption`, short rewrites | `claude-haiku-4-5` | High volume, latency-sensitive, low complexity |
| `brandStudio.copywriting`, `finance.insights` | `claude-opus-4-8` | Reasoning-heavy; **adaptive thinking** (`thinking: { type: "adaptive" }`), `effort: "high"` |
| `brandStudio.logo` | image-gen provider | Behind the same provider interface |

Requests use **streaming** for long outputs and the SDK's `getFinalMessage()`/`finalMessage()` helper. Keys are server-only (Doppler). Model IDs are config, not literals at call sites.

## 6. Error handling conventions

- **Use tRPC error codes**, not ad hoc strings: `UNAUTHORIZED` (no/invalid session), `FORBIDDEN` (role/entitlement/tenant), `NOT_FOUND`, `BAD_REQUEST` (Zod failure — automatic), `CONFLICT` (sync/version conflict), `TOO_MANY_REQUESTS` (Upstash rate-limit), `INTERNAL_SERVER_ERROR`.
- **Machine-readable `message` suffixes** for client branching: `ENTITLEMENT_REQUIRED:<key>` and `ROLE_REQUIRED` so the client can render an upgrade prompt or permission notice (see `feature-flags.md`). The `errorFormatter` attaches `{ code, entitlementKey?, requiredRole? }` to `error.data`.
- **Zod errors** are returned with field-level detail (flattened) so RHF can map them straight onto form fields.
- **Never leak provider internals** — wrap Meta/payment/Claude errors into stable tRPC codes; log the raw error to Pino → Better Stack with a `requestId`, return the `requestId` to the client for support.
- **Idempotency:** mutations that trigger external side effects accept the client-generated `id` and are idempotent server-side (safe retries after offline reconnect).
- **Rate limiting** via Upstash Redis at the Hono layer (per-user + per-org), surfaced as `TOO_MANY_REQUESTS` with a `retryAfter`.
