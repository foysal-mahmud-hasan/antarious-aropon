import { and, eq } from 'drizzle-orm';
import { schema } from '@aropon/db';
import { resolveEntitlements, type Entitlements } from '@aropon/core';
import type { Role, SubscriptionStatus, Tier } from '@aropon/validators';
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
  user: AuthUser | null;
  /** Active org for this request (from the `x-org-id` header), resolved + entitlement-loaded. */
  org: OrgContext | null;
}

/**
 * Verify the Supabase access token and return the user.
 * TODO(M0): verify the JWT signature with SUPABASE_JWT_SECRET (jose) and map `sub`→user id.
 * Stubbed shape kept stable so routers/middleware are final.
 */
export async function getUserFromAuthHeader(authorization?: string): Promise<AuthUser | null> {
  if (!authorization?.startsWith('Bearer ')) return null;
  // Placeholder until JWT verification is wired; never trust this in production.
  return null;
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
