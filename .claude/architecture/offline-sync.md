# Offline-First & Sync

> **Goal:** Aropon is offline-first. Local **SQLite (expo-sqlite) + Drizzle** is the on-device source of truth. **PowerSync** provides bidirectional, conflict-aware sync to **Supabase Postgres**. The **T0 "Offline Mode"** tier must be fully usable with zero connectivity and reconcile cleanly on reconnect.

## 1. Principles

1. **The UI reads and writes local SQLite only.** It never blocks on the network. PowerSync moves data in the background.
2. **One schema, two dialects.** `packages/db` defines tables once; the local-first subset is materialized as SQLite, the full set as Postgres.
3. **Writes are optimistic.** A mutation lands locally and is reflected in the UI immediately; sync happens after.
4. **Server-only actions are explicitly gated offline** (payments, AI, social posting) — they queue intent and run when online, with clear UI affordance.
5. **Conflicts are resolved deterministically** — last-write-wins for low-risk fields, domain-specific merges for money/stock.

## 2. Local SQLite + Drizzle schema (local-first subset)

The on-device DB holds the tables a user must operate on offline. Every local-first table carries `org_id`, `updated_at`, and a soft-delete `deleted_at` to make sync and tombstoning deterministic.

```ts
// packages/db/schema/local.ts  (SQLite dialect)
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),            // UUID generated CLIENT-SIDE (offline-safe)
  orgId: text("org_id").notNull(),
  name: text("name").notNull(),
  sku: text("sku"),
  priceMinor: integer("price_minor").notNull(), // BDT in poisha (integer money)
  updatedAt: integer("updated_at").notNull(),    // epoch ms, set on every write
  deletedAt: integer("deleted_at"),              // soft delete / tombstone
});

export const inventory = sqliteTable("inventory", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull(),
  productId: text("product_id").notNull(),
  qtyDelta: integer("qty_delta").notNull(),  // EVENT-SOURCED: +/- movements, not absolute
  reason: text("reason").notNull(),          // 'sale' | 'restock' | 'adjustment'
  updatedAt: integer("updated_at").notNull(),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull(),
  customerId: text("customer_id"),
  status: text("status").notNull(),          // 'draft'|'confirmed'|'fulfilled'|'cancelled'
  totalMinor: integer("total_minor").notNull(),
  updatedAt: integer("updated_at").notNull(),
  deletedAt: integer("deleted_at"),
});

export const orderItems = sqliteTable("order_items", { /* id, orgId, orderId, productId, qty, unitPriceMinor, updatedAt */ });
export const transactions = sqliteTable("transactions", { /* id, orgId, type income|expense, amountMinor, category, occurredAt, updatedAt */ });
export const customers = sqliteTable("customers", { /* id, orgId, name, phone, updatedAt, deletedAt */ });
```

**Why these choices:**
- **Client-generated UUIDs** — no server round-trip needed to create a row offline; no ID collisions on merge.
- **Integer money (`*_minor`, poisha)** — avoids float drift; safe for additive merges.
- **Event-sourced inventory (`qty_delta`)** — two offline devices both selling stock can each append a movement; the merge is `SUM(deltas)`, never a lost write. Absolute on-hand is a derived view.
- **`updated_at` + `deleted_at` on every row** — gives PowerSync and the conflict resolver the fields they need.

## 3. PowerSync sync rules

PowerSync **sync rules** define, per authenticated user, which Postgres rows stream down into their local SQLite — scoped by the user's org memberships so a device only ever holds its own tenants' data.

```yaml
# powersync-sync-rules.yaml
bucket_definitions:
  org_data:
    # one bucket per organization the user is a member of
    parameters: >
      SELECT org_id AS bucket_org FROM memberships
      WHERE user_id = request.user_id() AND status = 'active'
    data:
      - SELECT * FROM products      WHERE org_id = bucket.bucket_org AND deleted_at IS NULL
      - SELECT * FROM inventory     WHERE org_id = bucket.bucket_org
      - SELECT * FROM orders        WHERE org_id = bucket.bucket_org AND deleted_at IS NULL
      - SELECT * FROM order_items   WHERE org_id = bucket.bucket_org
      - SELECT * FROM transactions  WHERE org_id = bucket.bucket_org
      - SELECT * FROM customers     WHERE org_id = bucket.bucket_org AND deleted_at IS NULL
```

- **Buckets are keyed by `org_id`.** Switching/adding an org adds/removes a bucket; the org switcher just changes which buckets are active.
- **Sync rules mirror RLS.** What PowerSync streams down must be a subset of what RLS would allow — they are kept in lockstep (see `authorization.md`). RLS remains the hard server-side boundary; sync rules are the performance/scoping layer.
- **Upload:** local writes are captured in PowerSync's upload queue and applied to Postgres through a server-side connector that re-validates `org_id` and role before the write commits.

## 4. Conflict resolution strategy

PowerSync applies uploads in order; conflicts arise when two devices (or a device + server job) touched the same logical state while offline. Resolution is **per-domain**, not one-size-fits-all:

| Data | Strategy | Rationale |
|---|---|---|
| Product name, customer name, profile fields | **Last-write-wins (LWW)** by `updated_at` | Low stakes; latest human edit wins |
| `transactions` (ledger), `inventory` movements | **Append-only / additive merge** (never overwrite) | Each entry is an immutable event; money & stock must not lose writes — sum the deltas |
| `orders.status` | **Domain state machine** — terminal states win (`cancelled`/`fulfilled` > `confirmed` > `draft`) | A fulfilled order must not revert to draft because of a stale edit |
| `order_items` (qty/price on an open order) | **LWW per item**, but locked once order is non-`draft` | Edits to confirmed orders are server-rejected, not merged |
| Soft deletes (`deleted_at`) | **Delete wins over concurrent edit** | A deletion is intentional and shouldn't be resurrected by a stale update |
| Subscription/entitlement state | **Server-authoritative** (never client-merged) | Billing truth lives server-side (see `subscription-system.md`) |

**Mechanics:**
- The upload connector runs in a transaction: re-check `org_id`/role, apply the per-domain rule, bump `updated_at`, return success/conflict to PowerSync.
- **Additive tables are never updated in place** — only inserted — so they're conflict-free by construction.
- Unresolvable conflicts (e.g. edit to a locked order) are returned as **rejections**; the client surfaces them in a "needs attention" queue rather than silently dropping the change.

## 5. Local-first vs server-only data

| Category | Where it lives | Offline behavior |
|---|---|---|
| Products, inventory, orders, order items, transactions, customers/leads | **Local SQLite + synced** | Full read/write offline |
| Conversations / messages (FB/IG inbox) | **Synced down read-only**; replies queue | Read offline; sending a reply queues until online |
| Org / membership / roles | Synced down (read) | Read offline; changes are server-only |
| Subscriptions, entitlements, billing | **Server-only** (cached read) | Read last-known offline; mutations require online |
| Payments (SSLCommerz/bKash/Nagad) | **Server-only** | Disabled offline; intent deferred |
| AI generations (captions, insights, logos) | **Server-only** (results cached locally) | Generate online only; past results readable offline |
| Social posting (Meta Graph) | **Server-only** | Queued as scheduled intent; runs online via Inngest |
| Files (logos, receipts, media) | Supabase Storage | New captures stored locally + uploaded on reconnect |

## 6. T0 "Offline Mode" guarantees

T0 is the entry tier and is **defined by full offline usability**. Concretely:

1. **No network is ever required for core bookkeeping** — record sales, expenses, inventory movements, customers, and orders entirely offline.
2. **First run can complete offline** after a one-time authenticated bootstrap (the device must have synced at least once to receive its org buckets and keys).
3. **All offline writes are durable and reconcile on reconnect** using §4's rules — additive ledgers/inventory never lose data; LWW/state-machine rules handle the rest.
4. **Server-only features degrade gracefully** — AI, payments, and social posting show a clear "available when online" state rather than failing.
5. **Conflicts surface, never silently drop** — rejected merges land in a visible queue.
6. **Entitlements are read from the last-known cached snapshot offline** and re-verified server-side on reconnect (a downgrade applies on next sync; see `subscription-system.md`).

## 7. Interaction with the query cache

PowerSync is the source of truth for local-first data; TanStack Query wraps **server-only** RPC data. Where they meet:
- Local-first reads use PowerSync's reactive queries (watch SQLite) — no TanStack Query needed.
- Server-only reads use TanStack Query with offline persistence.
- A completed sync can invalidate dependent server-only queries (e.g. after orders sync, refetch the server-computed `finance.summary`). Details in `state-management.md` §6.
