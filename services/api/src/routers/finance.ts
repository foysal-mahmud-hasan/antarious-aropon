import { and, between, eq, isNull } from 'drizzle-orm';
import { schema } from '@aropon/db';
import { summarize, type LedgerEntry } from '@aropon/core';
import { createTransactionInput, financeSummaryInput } from '@aropon/validators';
import { requireEntitlement, router } from '../trpc';

/** Bookkeeping is gated on `finance.bookkeeping` (present from T0). */
const financeProcedure = requireEntitlement('finance.bookkeeping');

export const financeRouter = router({
  /** Server-side mirror of an offline-created transaction (PowerSync handles bulk sync). */
  addTransaction: financeProcedure
    .input(createTransactionInput)
    .mutation(async ({ ctx, input }) => {
      if (input.orgId !== ctx.org.orgId) {
        // belt-and-suspenders; RLS also enforces this
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

  summary: financeProcedure.input(financeSummaryInput).query(async ({ ctx, input }) => {
    const rows = await ctx.db
      .select({ type: schema.transactions.type, amountPoisha: schema.transactions.amountPoisha })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.orgId, ctx.org.orgId),
          isNull(schema.transactions.deletedAt),
          between(
            schema.transactions.occurredAt,
            new Date(input.from),
            new Date(input.to),
          ),
        ),
      );
    return summarize(rows as LedgerEntry[]);
  }),
});
