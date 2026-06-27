import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { schema } from '@aropon/db';
import { requestOtpInput, verifyOtpInput } from '@aropon/validators';
import { checkOtp, issueOtp, signSession } from '../auth';
import { publicProcedure, router } from '../trpc';

/**
 * Phone-OTP auth (local build). `requestOtp` returns the code in dev so testers can sign in with
 * no SMS gateway. `verifyOtp` find-or-creates the user, bootstraps an org + subscription on first
 * login, and returns a JWT session. Swappable for Supabase Auth + real SMS later.
 */
export const authRouter = router({
  requestOtp: publicProcedure.input(requestOtpInput).mutation(({ input }) => {
    const code = issueOtp(input.phone);
    const isDev = process.env.NODE_ENV !== 'production';
    return { sent: true as const, ...(isDev ? { devCode: code } : {}) };
  }),

  verifyOtp: publicProcedure.input(verifyOtpInput).mutation(async ({ ctx, input }) => {
    if (!checkOtp(input.phone, input.token)) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid or expired code' });
    }

    let user = await ctx.db.query.users.findFirst({
      where: eq(schema.users.phone, input.phone),
    });

    // First login → create the user and bootstrap their business (org + owner membership + T0 sub).
    if (!user) {
      const userId = randomUUID();
      const orgId = randomUUID();
      await ctx.db.insert(schema.users).values({ id: userId, phone: input.phone });
      await ctx.db
        .insert(schema.organizations)
        .values({ id: orgId, name: 'আমার ব্যবসা', ownerId: userId });
      await ctx.db
        .insert(schema.memberships)
        .values({ id: randomUUID(), orgId, userId, role: 'owner' });
      await ctx.db
        .insert(schema.subscriptions)
        .values({ id: randomUUID(), orgId, tier: 't0', status: 'active' });
      user = { id: userId, phone: input.phone, displayName: null, locale: 'bn', createdAt: new Date() };
    }

    const token = await signSession(ctx.authSecret, { sub: user.id, phone: user.phone });
    const memberships = await ctx.db.query.memberships.findMany({
      where: eq(schema.memberships.userId, user.id),
    });

    return {
      token,
      user: { id: user.id, phone: user.phone },
      orgs: memberships.map((m) => ({ orgId: m.orgId, role: m.role })),
    };
  }),
});
