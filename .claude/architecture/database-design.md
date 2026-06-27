# Database Design

> Postgres on Supabase is the backbone. Schema is defined once in **Drizzle** (`packages/db`) and reused for both server Postgres and the client SQLite subset (see `offline-sync.md`). Multi-tenancy is enforced by **Row-Level Security keyed on `org_id`** (see `authorization.md`). Money is stored as **integer minor units (poisha)**; timestamps are `timestamptz`.

## 1. Entities & relationships (ER overview)

```
users ──< memberships >── organizations
                              │
        ┌──────────┬──────────┼───────────┬────────────┬─────────────┐
        ▼          ▼          ▼           ▼            ▼             ▼
   subscriptions  products  customers   orders     transactions  conversations
                    │         (leads)     │                          │
                    ▼                     ▼                          ▼
                inventory            order_items                  messages
```

- `users` ⇄ `organizations` is **many-to-many via `memberships`** (each carries a `role`). One user → many businesses; one business → many members.
- `organizations` is the **tenant**. Every tenant-scoped table has `org_id` → `organizations.id`.
- `subscriptions` is 1:1-ish with an organization (current plan; history retained).
- `products` 1:N `inventory` (event-sourced movements) and referenced by `order_items`.
- `orders` 1:N `order_items`; `orders` N:1 `customers`.
- `customers` doubles as the **leads** table (a `kind` discriminator: `lead` | `customer`).
- `conversations` (one per FB/IG/contact thread) 1:N `messages`.

## 2. Core tables (Drizzle / SQL-style)

```ts
// packages/db/schema/server.ts  (Postgres dialect)
import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, pgEnum, index, uniqueIndex } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["owner", "manager", "staff"]);
export const orderStatusEnum = pgEnum("order_status", ["draft", "confirmed", "fulfilled", "cancelled"]);
export const txnTypeEnum = pgEnum("txn_type", ["income", "expense"]);
export const contactKindEnum = pgEnum("contact_kind", ["lead", "customer"]);
export const channelEnum = pgEnum("channel", ["facebook", "instagram", "whatsapp", "manual"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),               // mirrors Supabase auth.users.id
  phone: text("phone").unique(),             // primary identity in BD
  email: text("email").unique(),
  displayName: text("display_name"),
  locale: text("locale").notNull().default("bn"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  logoUrl: text("logo_url"),
  currency: text("currency").notNull().default("BDT"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  role: roleEnum("role").notNull().default("staff"),
  status: text("status").notNull().default("active"), // active | invited | revoked
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqMember: uniqueIndex("uq_membership_org_user").on(t.orgId, t.userId),
  byUser: index("ix_membership_user").on(t.userId),     // RLS lookups by caller
  byOrg: index("ix_membership_org").on(t.orgId),
}));

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  tier: text("tier").notNull(),                          // 't0'..'t4' (see subscription-system.md)
  status: text("status").notNull(),                      // active|past_due|grace|cancelled
  billingProvider: text("billing_provider"),             // sslcommerz|bkash|nagad|manual
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  graceEndsAt: timestamp("grace_ends_at", { withTimezone: true }),
  entitlementsOverride: jsonb("entitlements_override"),  // optional per-org overrides
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ byOrg: uniqueIndex("uq_subscription_org").on(t.orgId) }));

export const products = pgTable("products", {
  id: uuid("id").primaryKey(),                            // client-generated for offline
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  sku: text("sku"),
  priceMinor: integer("price_minor").notNull(),          // BDT poisha
  mediaUrls: jsonb("media_urls"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (t) => ({ byOrg: index("ix_products_org").on(t.orgId), bySku: index("ix_products_org_sku").on(t.orgId, t.sku) }));

// Event-sourced stock movements (see offline-sync.md §2). On-hand is a SUM view.
export const inventory = pgTable("inventory", {
  id: uuid("id").primaryKey(),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  productId: uuid("product_id").notNull().references(() => products.id),
  qtyDelta: integer("qty_delta").notNull(),
  reason: text("reason").notNull(),                      // sale|restock|adjustment
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ byProduct: index("ix_inventory_org_product").on(t.orgId, t.productId) }));

export const customers = pgTable("customers", {           // also the LEADS table
  id: uuid("id").primaryKey(),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  kind: contactKindEnum("kind").notNull().default("lead"),
  name: text("name"),
  phone: text("phone"),
  source: channelEnum("source").default("manual"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (t) => ({ byOrg: index("ix_customers_org").on(t.orgId), byPhone: index("ix_customers_org_phone").on(t.orgId, t.phone) }));

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey(),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  customerId: uuid("customer_id").references(() => customers.id),
  status: orderStatusEnum("status").notNull().default("draft"),
  totalMinor: integer("total_minor").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (t) => ({ byOrgStatus: index("ix_orders_org_status").on(t.orgId, t.status) }));

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey(),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  orderId: uuid("order_id").notNull().references(() => orders.id),
  productId: uuid("product_id").notNull().references(() => products.id),
  qty: integer("qty").notNull(),
  unitPriceMinor: integer("unit_price_minor").notNull(),
}, (t) => ({ byOrder: index("ix_order_items_order").on(t.orderId) }));

export const transactions = pgTable("transactions", {     // finance ledger (append-only)
  id: uuid("id").primaryKey(),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  type: txnTypeEnum("type").notNull(),
  amountMinor: integer("amount_minor").notNull(),
  category: text("category"),
  orderId: uuid("order_id").references(() => orders.id),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ byOrgTime: index("ix_txn_org_time").on(t.orgId, t.occurredAt) }));

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey(),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  channel: channelEnum("channel").notNull(),
  externalThreadId: text("external_thread_id"),          // Meta Graph thread id
  customerId: uuid("customer_id").references(() => customers.id),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
}, (t) => ({
  byOrgTime: index("ix_conv_org_time").on(t.orgId, t.lastMessageAt),
  uqExternal: uniqueIndex("uq_conv_external").on(t.orgId, t.channel, t.externalThreadId),
}));

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey(),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id),
  direction: text("direction").notNull(),                // inbound | outbound
  body: text("body"),
  isAutoReply: boolean("is_auto_reply").notNull().default(false),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ byConv: index("ix_messages_conv_time").on(t.conversationId, t.sentAt) }));
```

## 3. RLS policy approach (keyed on `org_id`)

Every tenant-scoped table has RLS **enabled and forced**, with policies that test membership against the calling user (`auth.uid()` from Supabase Auth). A reusable predicate keeps policies uniform:

```sql
-- Helper: is the current user an active member of this org?
create or replace function app.is_member(target_org uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from memberships m
    where m.org_id = target_org and m.user_id = auth.uid() and m.status = 'active'
  );
$$;

-- Helper: does the current user have at least the given role in this org?
create or replace function app.has_role(target_org uuid, min_role role)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from memberships m
    where m.org_id = target_org and m.user_id = auth.uid() and m.status = 'active'
      and array_position(array['staff','manager','owner']::role[], m.role)
          >= array_position(array['staff','manager','owner']::role[], min_role)
  );
$$;

alter table products enable row level security;
alter table products force row level security;

-- Read: any active member of the org
create policy products_select on products
  for select using (app.is_member(org_id));

-- Write: managers and owners (staff is read-mostly on catalog)
create policy products_write on products
  for all using (app.has_role(org_id, 'manager'))
  with check (app.has_role(org_id, 'manager'));
```

Rules:
- **Default deny.** RLS is forced; no policy ⇒ no access.
- **Read = `is_member(org_id)`**, write = `has_role(org_id, <min role for that domain>)` (role→action matrix in `authorization.md`).
- **`with check`** mirrors `using` so a row can't be inserted/updated into another tenant.
- **Sync rules mirror RLS** (`offline-sync.md` §3) — PowerSync never streams a row RLS would forbid.
- **Subscriptions/billing** rows are readable by members but writable only by the service role (server), never the client.

## 4. Multi-tenancy notes

- `org_id` is **non-null on every tenant table** and is part of composite indexes so every tenant query is index-served.
- The client carries an **active org** in context; queries always filter by it, and RLS enforces it independently (defense in depth).
- Cross-org reporting (a user with multiple businesses) is done by iterating the user's memberships — there is no cross-tenant join that bypasses `org_id`.

## 5. Indexing notes

- **Leading `org_id`** on every multi-tenant index — all reads are tenant-scoped, so `org_id` first maximizes selectivity (`ix_products_org`, `ix_orders_org_status`, `ix_txn_org_time`, …).
- **`memberships`** is indexed by both `user_id` (RLS predicate lookups, hot path) and `org_id`, plus a unique `(org_id, user_id)`.
- **Time-series tables** (`transactions`, `messages`, `conversations`) use `(org_id, <time>)` composites for range/period queries (finance summaries, inbox ordering).
- **Soft deletes:** partial indexes `WHERE deleted_at IS NULL` on `products`/`orders`/`customers` keep active-row scans small.
- **`inventory`** indexed by `(org_id, product_id)` so on-hand = `SUM(qty_delta)` per product is cheap; consider a periodically-refreshed materialized view of on-hand for large catalogs.
- **External thread uniqueness** (`uq_conv_external`) makes idempotent FB/IG sync upserts safe (see `background-jobs.md`).
