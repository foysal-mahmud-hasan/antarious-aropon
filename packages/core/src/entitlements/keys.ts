/**
 * Entitlement keys — the canonical capability vocabulary, aligned to the product brief.
 * Boolean keys = feature on/off. Limit keys = numeric caps (`-1` = unlimited).
 *
 * Adding a feature = add its key here AND set it across ALL FIVE tiers in `tiers.ts`
 * (the `Record<Tier, Entitlements>` is exhaustive, so a missing tier is a compile error).
 */

export const BOOLEAN_ENTITLEMENT_KEYS = [
  // Finance (T0 basic bookkeeping; T1 adds tracking + AI insights)
  'finance.bookkeeping',
  'finance.revenue_expense_profit',
  'finance.insights',
  'finance.performance_suggestions',
  // Brand Studio (T0 entry value per brief)
  'brand.ai_logo',
  'brand.ai_caption',
  'brand.copywriting',
  // Social commerce (T1)
  'social.facebook',
  'social.instagram',
  'social.inbox',
  'social.auto_reply',
  'social.manual_escalation',
  'orders.confirmation',
  'calendar.daily_weekly',
  // Commerce (T2)
  'website.integration',
  'inventory.management',
  'courier.integration',
  // CRM & Growth (T3)
  'crm.lead_capture',
  'crm.customer_db',
  'crm.lead_scoring',
  'growth.upsell',
  'growth.crosssell',
  // Business Intelligence (T4)
  'reports.dashboard',
  'reports.summaries',
  'analytics.tracking',
  'ai.lead_closing',
  // Platform
  'sync.cloud',
  'members.invite',
  'members.roles',
] as const;

export const LIMIT_ENTITLEMENT_KEYS = ['limits.products', 'limits.members'] as const;

export type BooleanEntitlementKey = (typeof BOOLEAN_ENTITLEMENT_KEYS)[number];
export type LimitEntitlementKey = (typeof LIMIT_ENTITLEMENT_KEYS)[number];
export type EntitlementKey = BooleanEntitlementKey | LimitEntitlementKey;

export type Entitlements = Record<BooleanEntitlementKey, boolean> &
  Record<LimitEntitlementKey, number>;

export const UNLIMITED = -1;
