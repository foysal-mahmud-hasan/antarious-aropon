import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { BooleanEntitlementKey } from '@aropon/core';
import { hasEntitlement } from '@aropon/core';
import type { Role } from '@aropon/validators';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;

/** Requires an authenticated user. */
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { ...ctx, user: ctx.user } });
});
export const protectedProcedure = t.procedure.use(isAuthed);

/** Requires an authenticated user AND an active org context (membership resolved). */
const hasOrg = t.middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  if (!ctx.org) throw new TRPCError({ code: 'FORBIDDEN', message: 'No active organization' });
  return next({ ctx: { ...ctx, user: ctx.user, org: ctx.org } });
});
export const orgProcedure = t.procedure.use(hasOrg);

/** Server-side tier gate: rejects calls the org's tier doesn't entitle. */
export function requireEntitlement(key: BooleanEntitlementKey) {
  return orgProcedure.use(({ ctx, next }) => {
    if (!hasEntitlement(ctx.org.entitlements, key)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Your plan does not include "${key}"`,
      });
    }
    return next();
  });
}

/** Role gate (owner > manager > staff). */
const ROLE_RANK: Record<Role, number> = { staff: 0, manager: 1, owner: 2 };
export function requireRole(min: Role) {
  return orgProcedure.use(({ ctx, next }) => {
    if (ROLE_RANK[ctx.org.role] < ROLE_RANK[min]) {
      throw new TRPCError({ code: 'FORBIDDEN', message: `Requires ${min} role` });
    }
    return next();
  });
}
