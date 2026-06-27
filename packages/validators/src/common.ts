import { z } from 'zod';

/** UUID v4 primary keys (used everywhere; generated client-side for offline-first writes). */
export const uuidSchema = z.string().uuid();

/**
 * Bangladeshi mobile number in E.164 (+8801XXXXXXXXX). We normalise local `01XXXXXXXXX`
 * to `+880...` before validation at the edge; this schema is the canonical stored form.
 */
export const bdPhoneSchema = z
  .string()
  .regex(/^\+8801[3-9]\d{8}$/, 'Must be a valid Bangladeshi mobile number (+8801XXXXXXXXX)');

/** Money is ALWAYS integer poisha (1 BDT = 100 poisha). Never floats. */
export const poishaSchema = z.number().int();
export const positivePoishaSchema = z.number().int().nonnegative();

export const tierSchema = z.enum(['t0', 't1', 't2', 't3', 't4']);
export type Tier = z.infer<typeof tierSchema>;

export const roleSchema = z.enum(['owner', 'manager', 'staff']);
export type Role = z.infer<typeof roleSchema>;

export const subscriptionStatusSchema = z.enum([
  'trialing',
  'active',
  'past_due',
  'grace',
  'cancelled',
  'expired',
]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

export const paginationInput = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});
export type PaginationInput = z.infer<typeof paginationInput>;
