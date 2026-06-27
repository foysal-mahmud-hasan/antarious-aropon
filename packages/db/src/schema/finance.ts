import {
  bigint,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { organizations } from './tenants';

export const txnTypeEnum = pgEnum('txn_type', ['income', 'expense']);

/**
 * Bookkeeping ledger. Append-only by convention (corrections = reversing entries, not edits)
 * so offline writes from multiple devices merge losslessly. Money is INTEGER POISHA.
 * `id` is generated on-device (UUID) so a write succeeds with no connectivity.
 */
export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    type: txnTypeEnum('type').notNull(),
    amountPoisha: bigint('amount_poisha', { mode: 'number' }).notNull(),
    category: text('category').notNull(),
    note: text('note'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    // Soft-delete (a reversing tombstone) keeps the ledger append-only for sync.
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    byOrgTime: index('transactions_org_time_idx').on(t.orgId, t.occurredAt),
  }),
);
