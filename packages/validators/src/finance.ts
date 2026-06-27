import { z } from 'zod';
import { poishaSchema, uuidSchema } from './common';

export const transactionTypeSchema = z.enum(['income', 'expense']);
export type TransactionType = z.infer<typeof transactionTypeSchema>;

/**
 * Offline-first create. `id` and `occurredAt` are generated on-device so the write succeeds
 * with no connectivity; `amountPoisha` is a positive integer (the `type` carries the sign).
 */
export const createTransactionInput = z.object({
  id: uuidSchema,
  orgId: uuidSchema,
  type: transactionTypeSchema,
  amountPoisha: poishaSchema.refine((n) => n > 0, 'Amount must be greater than zero'),
  category: z.string().min(1).max(40),
  note: z.string().max(280).optional(),
  occurredAt: z.string().datetime(),
});
export type CreateTransactionInput = z.infer<typeof createTransactionInput>;

export const financeSummaryInput = z.object({
  orgId: uuidSchema,
  from: z.string().datetime(),
  to: z.string().datetime(),
});
export type FinanceSummaryInput = z.infer<typeof financeSummaryInput>;
