import { describe, expect, it } from 'vitest';
import { TIER_ENTITLEMENTS } from './tiers';
import { effectiveTier, hasEntitlement, resolveEntitlements, withinLimit } from './resolve';

describe('tier entitlement map (brief-aligned)', () => {
  it('T0 includes Brand Studio AI and basic bookkeeping but is local-only', () => {
    const t0 = TIER_ENTITLEMENTS.t0;
    expect(t0['brand.ai_logo']).toBe(true);
    expect(t0['brand.ai_caption']).toBe(true);
    expect(t0['brand.copywriting']).toBe(true);
    expect(t0['finance.bookkeeping']).toBe(true);
    expect(t0['sync.cloud']).toBe(false);
    expect(t0['social.inbox']).toBe(false);
  });

  it('T1 adds social commerce + cloud sync and KEEPS T0 Brand Studio (cumulative)', () => {
    const t1 = TIER_ENTITLEMENTS.t1;
    expect(t1['social.inbox']).toBe(true);
    expect(t1['social.auto_reply']).toBe(true);
    expect(t1['orders.confirmation']).toBe(true);
    expect(t1['finance.insights']).toBe(true);
    expect(t1['sync.cloud']).toBe(true);
    // cumulative: still has T0 brand studio
    expect(t1['brand.ai_caption']).toBe(true);
    // not yet: commerce/CRM/BI
    expect(t1['inventory.management']).toBe(false);
    expect(t1['reports.dashboard']).toBe(false);
  });

  it('tiers are strictly cumulative for boolean capabilities', () => {
    const order = ['t0', 't1', 't2', 't3', 't4'] as const;
    for (let i = 1; i < order.length; i++) {
      const lower = TIER_ENTITLEMENTS[order[i - 1]!];
      const higher = TIER_ENTITLEMENTS[order[i]!];
      for (const key of Object.keys(lower) as (keyof typeof lower)[]) {
        if (typeof lower[key] === 'boolean' && lower[key] === true) {
          expect(higher[key], `${order[i]} should keep ${String(key)}`).toBe(true);
        }
      }
    }
  });

  it('T4 has unlimited products and members', () => {
    expect(TIER_ENTITLEMENTS.t4['limits.products']).toBe(-1);
    expect(TIER_ENTITLEMENTS.t4['limits.members']).toBe(-1);
  });
});

describe('effective tier by billing status', () => {
  it('keeps paid tier while active/grace/past_due/trialing', () => {
    expect(effectiveTier('t1', 'active')).toBe('t1');
    expect(effectiveTier('t1', 'grace')).toBe('t1');
    expect(effectiveTier('t1', 'past_due')).toBe('t1');
    expect(effectiveTier('t2', 'trialing')).toBe('t2');
  });

  it('drops to t0 when cancelled or expired', () => {
    expect(effectiveTier('t3', 'cancelled')).toBe('t0');
    expect(effectiveTier('t4', 'expired')).toBe('t0');
  });
});

describe('resolveEntitlements', () => {
  it('applies effective tier then overrides', () => {
    const ent = resolveEntitlements('t0', 'active', { 'brand.ai_logo': false });
    expect(hasEntitlement(ent, 'brand.ai_logo')).toBe(false);
    expect(hasEntitlement(ent, 'finance.bookkeeping')).toBe(true);
  });

  it('a cancelled T1 sub sees only t0 features', () => {
    const ent = resolveEntitlements('t1', 'cancelled');
    expect(hasEntitlement(ent, 'social.inbox')).toBe(false);
    expect(hasEntitlement(ent, 'brand.ai_caption')).toBe(true);
  });
});

describe('withinLimit', () => {
  it('respects finite limits and unlimited (-1)', () => {
    const t1 = TIER_ENTITLEMENTS.t1;
    expect(withinLimit(t1, 'limits.members', 1)).toBe(true);
    expect(withinLimit(t1, 'limits.members', 2)).toBe(false);
    const t4 = TIER_ENTITLEMENTS.t4;
    expect(withinLimit(t4, 'limits.products', 9_999_999)).toBe(true);
  });
});
