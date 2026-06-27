import { orgProcedure, protectedProcedure, router } from '../trpc';

export const orgRouter = router({
  /** The active org context (tier, role, resolved entitlements) for the client to mirror gates. */
  current: orgProcedure.query(({ ctx }) => ({
    orgId: ctx.org.orgId,
    role: ctx.org.role,
    tier: ctx.org.tier,
    status: ctx.org.status,
    entitlements: ctx.org.entitlements,
  })),

  /** Orgs the user belongs to (for the org switcher). */
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.query.memberships.findMany({
      where: (m, { eq }) => eq(m.userId, ctx.user.id),
    });
    return rows.map((m) => ({ orgId: m.orgId, role: m.role }));
  }),
});
