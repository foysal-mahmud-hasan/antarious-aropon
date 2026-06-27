import { and, eq } from 'drizzle-orm';
import { schema } from '@aropon/db';
import { resolveEntitlements, type Entitlements } from '@aropon/core';
import type { Role, SubscriptionStatus, Tier } from '@aropon/validators';
import { verifySession } from './auth';
import type { Db } from './db';

export interface AuthUser {
  id: string;
  phone: string;
}

export interface OrgContext {
  orgId: string;
  role: Role;
  tier: Tier;
  status: SubscriptionStatus;
  entitlements: Entitlements;
}

export interface Context {
  db: Db;
  authSecret: string;
  user: AuthUser | null;
  /** Active org for this request (from `x-org-id` or the user's first org), entitlement-loaded. */
  org: OrgContext | null;
}

/** Verify the JWT session token from the Authorization header. */
export async function getUserFromAuthHeader(
  secret: string,
  authorization?: string,
): Promise<AuthUser | null> {
  if (!authorization?.startsWith('Bearer ')) return null;
  const session = await verifySession(secret, authorization.slice(7));
  return session ? { id: session.sub, phone: session.phone } : null;
}

/** The user's first org id (used to default the active org when no header is sent). */
export async function firstOrgIdFor(db: Db, userId: string): Promise<string | null> {
  const m = await db.query.memberships.findFirst({
    where: eq(schema.memberships.userId, userId),
  });
  return m?.orgId ?? null;
}

/** Load the caller's membership + subscription for an org and resolve effective entitlements. */
export async function loadOrgContext(
  db: Db,
  userId: string,
  orgId: string,
): Promise<OrgContext | null> {
  const membership = await db.query.memberships.findFirst({
    where: and(eq(schema.memberships.orgId, orgId), eq(schema.memberships.userId, userId)),
  });
  if (!membership) return null;

  const sub = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.orgId, orgId),
  });
  const tier: Tier = sub?.tier ?? 't0';
  const status: SubscriptionStatus = sub?.status ?? 'active';
  const overrides = (sub?.entitlementsOverride as Partial<Entitlements> | null) ?? undefined;

  return {
    orgId,
    role: membership.role,
    tier,
    status,
    entitlements: resolveEntitlements(tier, status, overrides),
  };
}
