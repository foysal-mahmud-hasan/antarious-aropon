import { sql } from 'drizzle-orm';
import {
  bigint,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Multi-tenant core. `organization` is the tenant; every domain row carries `org_id` and is
 * isolated by Postgres RLS (policies live in SQL migrations — see architecture/database-design.md).
 * `users.id` mirrors Supabase `auth.users.id`.
 */

export const roleEnum = pgEnum('role', ['owner', 'manager', 'staff']);
export const tierEnum = pgEnum('tier', ['t0', 't1', 't2', 't3', 't4']);
export const subStatusEnum = pgEnum('sub_status', [
  'trialing',
  'active',
  'past_due',
  'grace',
  'cancelled',
  'expired',
]);

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  ownerId: uuid('owner_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // = Supabase auth.users.id
  phone: text('phone').notNull().unique(),
  displayName: text('display_name'),
  locale: text('locale').notNull().default('bn'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: roleEnum('role').notNull().default('staff'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgUserUnique: unique('memberships_org_user_unique').on(t.orgId, t.userId),
    byUser: index('memberships_user_idx').on(t.userId),
  }),
);

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid('org_id')
    .notNull()
    .unique()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  tier: tierEnum('tier').notNull().default('t0'),
  status: subStatusEnum('status').notNull().default('active'),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  graceEndsAt: timestamp('grace_ends_at', { withTimezone: true }),
  // Optional per-org entitlement overrides (pilots/support grants), keyed by EntitlementKey.
  entitlementsOverride: jsonb('entitlements_override'),
  pricePoisha: bigint('price_poisha', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
