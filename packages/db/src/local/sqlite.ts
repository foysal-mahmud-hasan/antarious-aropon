import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * LOCAL-FIRST subset (on-device SQLite, the source of truth offline). PowerSync reconciles
 * these tables to the Postgres tables of the same name. Kept deliberately minimal — only what
 * must work offline (T0 bookkeeping + catalog). Money stays INTEGER POISHA; timestamps are ISO
 * strings; UUID PKs are generated on-device so writes never wait on the network.
 *
 * `_synced` is a local-only flag (0 = pending upload, 1 = reconciled) used by the sync UI.
 */

export const localTransactions = sqliteTable(
  'transactions',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id').notNull(),
    type: text('type', { enum: ['income', 'expense'] }).notNull(),
    amountPoisha: integer('amount_poisha').notNull(),
    category: text('category').notNull(),
    note: text('note'),
    occurredAt: text('occurred_at').notNull(),
    createdBy: text('created_by').notNull(),
    createdAt: text('created_at').notNull(),
    deletedAt: text('deleted_at'),
    synced: integer('_synced').notNull().default(0),
  },
  (t) => ({ byOrgTime: index('local_transactions_org_time_idx').on(t.orgId, t.occurredAt) }),
);

export const localProducts = sqliteTable('products', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull(),
  name: text('name').notNull(),
  pricePoisha: integer('price_poisha').notNull().default(0),
  createdAt: text('created_at').notNull(),
  synced: integer('_synced').notNull().default(0),
});
