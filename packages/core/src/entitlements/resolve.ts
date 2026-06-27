import type { SubscriptionStatus, Tier } from '@aropon/validators';
import { TIER_ENTITLEMENTS } from './tiers';
import {
  UNLIMITED,
  type BooleanEntitlementKey,
  type Entitlements,
  type LimitEntitlementKey,
} from './keys';

/**
 * Effective tier = paid tier while the subscription grants access, else free `t0`.
 * Paying customers keep full access through `grace`/`past_due`/`trialing`; only a
 * terminated subscription drops to `t0`. (See subscription-system.md §3.)
 */
export function effectiveTier(tier: Tier, status: SubscriptionStatus): Tier {
  switch (status) {
    case 'trialing':
    case 'active':
    case 'past_due':
    case 'grace':
      return tier;
    case 'cancelled':
    case 'expired':
      return 't0';
  }
}

/**
 * Resolve the entitlements a request should see: effective-tier base map, then optional
 * per-org overrides (pilots/support grants). This is the ONLY function gates should call.
 */
export function resolveEntitlements(
  tier: Tier,
  status: SubscriptionStatus,
  overrides?: Partial<Entitlements>,
): Entitlements {
  const base = TIER_ENTITLEMENTS[effectiveTier(tier, status)];
  return overrides ? { ...base, ...overrides } : { ...base };
}

export function hasEntitlement(ent: Entitlements, key: BooleanEntitlementKey): boolean {
  return ent[key] === true;
}

/** True if adding one more of `key` stays within the limit (`-1` = unlimited). */
export function withinLimit(
  ent: Entitlements,
  key: LimitEntitlementKey,
  currentCount: number,
): boolean {
  const limit = ent[key];
  return limit === UNLIMITED || currentCount < limit;
}
