# Authorization

> Authorization is **three layers that all agree**: (1) **Postgres RLS** isolates tenants by `org_id`; (2) **RBAC roles** (`owner`/`manager`/`staff`) decide who-can-do-what within a tenant; (3) a central **entitlements engine** maps subscription **tier → feature set**. All three are **server-enforced**; the client mirrors (2) and (3) for UX only (`<TierGate>`), never as the security boundary.

## 1. The three layers

```
                      ┌───────────────────────────────────────────────┐
 Request (JWT + orgId)│  Layer 1: RLS (Postgres)                       │
 ─────────────────────►  "Can THIS user touch rows in THIS org?"       │
                      │   → app.is_member(org_id) / app.has_role(...)  │
                      ├───────────────────────────────────────────────┤
                      │  Layer 2: RBAC (API middleware + RLS roles)    │
                      │  "Does the user's ROLE permit this action?"    │
                      │   → requireRole('manager') etc.                │
                      ├───────────────────────────────────────────────┤
                      │  Layer 3: Entitlements (engine in core)        │
                      │  "Does the org's TIER include this feature?"   │
                      │   → requireEntitlement('finance.insights')     │
                      └───────────────────────────────────────────────┘
        Client: <TierGate>/<RoleGate> render the same answer for UX only.
```

These are **orthogonal**: RLS answers *which tenant*, RBAC answers *which person*, entitlements answer *which plan*. A request must pass all that apply.

## 2. Layer 1 — RLS (tenant isolation)

Defined in `database-design.md` §3. Every tenant table has RLS forced; policies use `app.is_member(org_id)` for reads and `app.has_role(org_id, <min>)` for writes, reading the user id from the Supabase JWT (`auth.uid()`). This is the **hard boundary**: even a bug in the API cannot cross tenants because Postgres rejects the row. **PowerSync sync rules mirror RLS** so the offline replica only ever contains rows RLS would permit.

## 3. Layer 2 — RBAC roles

Roles live on the `memberships` row (`owner` > `manager` > `staff`). One user has different roles in different orgs.

| Capability | staff | manager | owner |
|---|:---:|:---:|:---:|
| Record sales / expenses, create orders, edit customers | ✅ | ✅ | ✅ |
| Edit product catalog & pricing | read | ✅ | ✅ |
| View finance summaries & AI insights | ✅ | ✅ | ✅ |
| Connect FB/IG, send/auto-reply in inbox | ✅ | ✅ | ✅ |
| Invite / remove members, change roles | ❌ | ✅ (staff only) | ✅ (all) |
| Manage subscription / billing / tier changes | ❌ | ❌ | ✅ |
| Delete the organization | ❌ | ❌ | ✅ |

Enforcement:
- **API:** `requireRole(min)` middleware (`api-spec.md` §3) → `FORBIDDEN` with `message: "ROLE_REQUIRED"` and `error.data.requiredRole`.
- **DB:** write policies use `app.has_role(org_id, <min>)`, so the same rule holds even on a direct Supabase write.
- **Ordering matters:** `array_position(['staff','manager','owner'], role)` gives a total order so "at least manager" is a single comparison.

## 4. Layer 3 — entitlements engine (tier → features)

The engine lives in `packages/core/entitlements` and is the **single definition** of what each tier unlocks. It is consumed by the **server** (to enforce) and the **client** (to render `<TierGate>`), so they can never disagree.

```ts
// packages/core/entitlements/keys.ts
export type EntitlementKey =
  | "finance.basic" | "finance.insights"            // bookkeeping vs AI insights
  | "brand.ai_caption" | "brand.copywriting" | "brand.ai_logo"
  | "social.inbox" | "social.auto_reply" | "social.scheduling"
  | "orders.confirmation_flow"
  | "members.invite" | "members.roles"
  | "limits.products" | "limits.members";           // numeric limits

export type Entitlements = Record<EntitlementKey, boolean | number>;

// resolve(tier, overrides) → fully-expanded Entitlements; see subscription-system.md for the map
export function resolveEntitlements(tier: Tier, overrides?: Partial<Entitlements>): Entitlements { /* ... */ }
```

- The **full tier→entitlement table** is in `subscription-system.md` (authoritative data structure). This doc covers *enforcement*; that doc covers *the values*.
- **Entitlements are independent of billing state day-to-day** but are *derived from* the subscription tier + status (e.g. a `grace`/`past_due` subscription still resolves the paid tier until `graceEndsAt`; see `subscription-system.md`).
- **Per-org overrides** (`subscriptions.entitlements_override`) allow manual grants (pilots, support) without code changes.

### Server-side enforcement
- On every `orgProcedure`, context is loaded with `entitlements = resolveEntitlements(sub.tier, sub.entitlementsOverride)`.
- `requireEntitlement(key)` middleware throws `FORBIDDEN` with `message: "ENTITLEMENT_REQUIRED:<key>"` and `error.data.entitlementKey`.
- Numeric limits (`limits.products`, `limits.members`) are checked in the mutation against current counts (e.g. block the 51st product on a tier capped at 50).

### Client-side surfacing (UX only)
- `<TierGate entitlement="finance.insights">…</TierGate>` reads the same resolved entitlements from context and renders the feature or an **upgrade prompt** (`feature-flags.md`).
- This is **purely cosmetic** — a user who bypasses the client still hits the server `requireEntitlement` and RLS. Never trust the client gate for security.

## 5. How a request is authorized end-to-end (example: `finance.insights`)

1. **JWT verified** → `ctx.userId` set (else `UNAUTHORIZED`).
2. **Active org resolved** from `x-aropon-org`; membership loaded → `ctx.role`, `ctx.orgId` (else `FORBIDDEN: NO_ACTIVE_ORG`).
3. **RBAC:** `finance.insights` needs ≥ `staff` (read) — passes.
4. **Entitlement:** `requireEntitlement("finance.insights")` — if the org is on `t0`/`t1` (no insights), throws `FORBIDDEN: ENTITLEMENT_REQUIRED:finance.insights`; client shows upgrade CTA.
5. **RLS:** the underlying query only returns the org's rows; another tenant's data is invisible at the DB.

## 6. Invariants for contributors

- **Never add a privileged action without all applicable layers.** A new write endpoint needs: an RLS write policy, a `requireRole`/`requireEntitlement` guard, and (if gated) an entitlement key + `<TierGate>`.
- **Entitlement keys are dot-namespaced and centralized** in `packages/core/entitlements` — don't invent ad hoc booleans at call sites.
- **Roles are coarse and fixed** (`owner`/`manager`/`staff`). Finer control is expressed via entitlements/limits, not new roles.
- **The client gate and the server guard share the same key** so they cannot drift.
- **Sync rules ⊆ RLS** — any new tenant table added to PowerSync buckets must already have an RLS read policy.
