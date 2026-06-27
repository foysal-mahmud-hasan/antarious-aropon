import { eq } from 'drizzle-orm';
import { schema } from '@aropon/db';
import { setTierInput } from '@aropon/validators';
import { requireRole, router } from '../trpc';

export const billingRouter = router({
  /**
   * TEST BUILD ONLY: lets an owner switch their org's tier so testers can exercise both T0 and T1.
   * In production this is replaced by real billing (payment result → tier via webhook).
   */
  setTier: requireRole('owner').input(setTierInput).mutation(async ({ ctx, input }) => {
    await ctx.db
      .update(schema.subscriptions)
      .set({ tier: input.tier, status: 'active', updatedAt: new Date() })
      .where(eq(schema.subscriptions.orgId, ctx.org.orgId));
    return { ok: true as const, tier: input.tier };
  }),
});
