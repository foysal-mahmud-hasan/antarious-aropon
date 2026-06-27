import { randomInt, randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { schema } from '@aropon/db';
import { demoLoginInput, requestOtpInput, verifyOtpInput } from '@aropon/validators';
import type { Tier } from '@aropon/validators';
import { checkOtp, issueOtp, signSession } from '../auth';
import { seedOrgData } from '../seed';
import type { Db } from '../db';
import { orgProcedure, publicProcedure, router } from '../trpc';

const isTestBuild = () => process.env.NODE_ENV !== 'production';

/** A unique, schema-valid BD demo number (+88017XXXXXXXX). */
function demoPhone(): string {
  let p = '+88017';
  for (let i = 0; i < 8; i++) p += randomInt(0, 10);
  return p;
}

async function bootstrapOrg(
  db: Db,
  opts: { userId: string; phone: string; orgName: string; tier: Tier },
) {
  const orgId = randomUUID();
  await db.insert(schema.users).values({ id: opts.userId, phone: opts.phone, displayName: 'ডেমো' });
  await db.insert(schema.organizations).values({ id: orgId, name: opts.orgName, ownerId: opts.userId });
  await db.insert(schema.memberships).values({ id: randomUUID(), orgId, userId: opts.userId, role: 'owner' });
  await db
    .insert(schema.subscriptions)
    .values({ id: randomUUID(), orgId, tier: opts.tier, status: 'active' });
  return orgId;
}

/**
 * Phone-OTP auth (local build). `requestOtp` returns the code in dev so testers can sign in with
 * no SMS gateway. `verifyOtp` find-or-creates the user (persistent own workspace). `demoLogin`
 * spins up a FRESH ISOLATED workspace per tap (clean slate, no collisions). All swappable for
 * Supabase Auth + SMS later.
 */
export const authRouter = router({
  requestOtp: publicProcedure.input(requestOtpInput).mutation(({ input }) => {
    const code = issueOtp(input.phone);
    return { sent: true as const, ...(isTestBuild() ? { devCode: code } : {}) };
  }),

  verifyOtp: publicProcedure.input(verifyOtpInput).mutation(async ({ ctx, input }) => {
    if (!checkOtp(input.phone, input.token)) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid or expired code' });
    }
    let user = await ctx.db.query.users.findFirst({ where: eq(schema.users.phone, input.phone) });
    let created = false;
    if (!user) {
      created = true;
      const userId = randomUUID();
      await bootstrapOrg(ctx.db, { userId, phone: input.phone, orgName: 'আমার ব্যবসা', tier: 't0' });
      user = { id: userId, phone: input.phone, displayName: null, locale: 'bn', createdAt: new Date() };
    }
    const token = await signSession(ctx.authSecret, { sub: user.id, phone: user.phone });
    const memberships = await ctx.db.query.memberships.findMany({
      where: eq(schema.memberships.userId, user.id),
    });
    return {
      token,
      created,
      user: { id: user.id, phone: user.phone },
      orgs: memberships.map((m) => ({ orgId: m.orgId, role: m.role })),
    };
  }),

  /** Tap a tier → brand-new isolated workspace pre-seeded with that tier's demo data. */
  demoLogin: publicProcedure.input(demoLoginInput).mutation(async ({ ctx, input }) => {
    if (!isTestBuild()) throw new TRPCError({ code: 'FORBIDDEN' });
    const userId = randomUUID();
    const phone = demoPhone();
    const orgName = input.tier === 't1' ? 'ডেমো শপ' : 'ডেমো দোকান';
    const orgId = await bootstrapOrg(ctx.db, { userId, phone, orgName, tier: input.tier });
    await seedOrgData(ctx.db, orgId, input.tier, userId);
    const token = await signSession(ctx.authSecret, { sub: userId, phone });
    return { token, user: { id: userId, phone }, orgs: [{ orgId, role: 'owner' as const }] };
  }),

  /** Wipe the active org's data back to a clean slate (test build only). */
  resetMyData: orgProcedure.mutation(async ({ ctx }) => {
    if (!isTestBuild()) throw new TRPCError({ code: 'FORBIDDEN' });
    const orgId = ctx.org.orgId;
    // orders→order_items and conversations→messages cascade via FK on delete.
    await ctx.db.delete(schema.transactions).where(eq(schema.transactions.orgId, orgId));
    await ctx.db.delete(schema.orders).where(eq(schema.orders.orgId, orgId));
    await ctx.db.delete(schema.conversations).where(eq(schema.conversations.orgId, orgId));
    await ctx.db.delete(schema.customers).where(eq(schema.customers.orgId, orgId));
    await ctx.db.delete(schema.products).where(eq(schema.products.orgId, orgId));
    return { ok: true as const };
  }),
});
