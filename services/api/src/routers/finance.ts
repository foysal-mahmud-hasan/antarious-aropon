import { and, between, desc, eq, isNull } from 'drizzle-orm';
import { schema } from '@aropon/db';
import { balancePoisha, summarize, type LedgerEntry } from '@aropon/core';
import {
  createTransactionInput,
  financeSummaryInput,
  listTransactionsInput,
  orgScopedInput,
} from '@aropon/validators';
import { requireEntitlement, router } from '../trpc';

/** Bookkeeping is gated on `finance.bookkeeping` (present from T0). */
const financeProcedure = requireEntitlement('finance.bookkeeping');

export const financeRouter = router({
  /** Record an income/expense entry (id generated client-side for offline-first writes). */
  addTransaction: financeProcedure
    .input(createTransactionInput)
    .mutation(async ({ ctx, input }) => {
      if (input.orgId !== ctx.org.orgId) {
        return { ok: false as const };
      }
      await ctx.db.insert(schema.transactions).values({
        id: input.id,
        orgId: input.orgId,
        type: input.type,
        amountPoisha: input.amountPoisha,
        category: input.category,
        note: input.note ?? null,
        occurredAt: new Date(input.occurredAt),
        createdBy: ctx.user.id,
      });
      return { ok: true as const, id: input.id };
    }),

  /** Latest transactions for the org (newest first). */
  list: financeProcedure.input(listTransactionsInput).query(async ({ ctx, input }) => {
    const rows = await ctx.db
      .select()
      .from(schema.transactions)
      .where(
        and(eq(schema.transactions.orgId, ctx.org.orgId), isNull(schema.transactions.deletedAt)),
      )
      .orderBy(desc(schema.transactions.occurredAt))
      .limit(input.limit);
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      amountPoisha: r.amountPoisha,
      category: r.category,
      note: r.note,
      occurredAt: r.occurredAt.toISOString(),
    }));
  }),

  /** All-time running balance (income − expense), in poisha. */
  balance: financeProcedure.input(orgScopedInput).query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({ type: schema.transactions.type, amountPoisha: schema.transactions.amountPoisha })
      .from(schema.transactions)
      .where(
        and(eq(schema.transactions.orgId, ctx.org.orgId), isNull(schema.transactions.deletedAt)),
      );
    return { balancePoisha: balancePoisha(rows as LedgerEntry[]) };
  }),

  /** Income / expense / profit over a date range. */
  summary: financeProcedure.input(financeSummaryInput).query(async ({ ctx, input }) => {
    const rows = await ctx.db
      .select({ type: schema.transactions.type, amountPoisha: schema.transactions.amountPoisha })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.orgId, ctx.org.orgId),
          isNull(schema.transactions.deletedAt),
          between(schema.transactions.occurredAt, new Date(input.from), new Date(input.to)),
        ),
      );
    return summarize(rows as LedgerEntry[]);
  }),
});
