import type { Tier } from '@aropon/validators';
import {
  BOOLEAN_ENTITLEMENT_KEYS,
  UNLIMITED,
  type BooleanEntitlementKey,
  type Entitlements,
} from './keys';

/** Base map with every boolean capability OFF; limits start at 0. */
function baseEntitlements(): Entitlements {
  const ent = {} as Entitlements;
  for (const key of BOOLEAN_ENTITLEMENT_KEYS) ent[key] = false;
  ent['limits.products'] = 0;
  ent['limits.members'] = 0;
  return ent;
}

/** Apply a patch on top of a base, returning a new object. */
function grant(
  base: Entitlements,
  on: BooleanEntitlementKey[],
  limits: { products: number; members: number },
): Entitlements {
  const next: Entitlements = { ...base };
  for (const key of on) next[key] = true;
  next['limits.products'] = limits.products;
  next['limits.members'] = limits.members;
  return next;
}

/** The boolean keys currently enabled on a map (for cumulative inheritance). */
function booleanKeysOf(ent: Entitlements): BooleanEntitlementKey[] {
  return BOOLEAN_ENTITLEMENT_KEYS.filter((k) => ent[k]);
}

// --- Tiers are CUMULATIVE: each tier inherits the lower tier and adds capabilities. ---
//
// ON HOLD / NOT YET ASSIGNED (keys exist but stay false everywhere until built):
//   brand.*  (Brand Studio — a SEPARATE feature list, not part of T0)
//   finance.insights, finance.performance_suggestions, ai.lead_closing  (AI agent — deferred)

// T0 — Offline Mode: basic bookkeeping ONLY. Local-only (no cloud sync). 200 BDT.
const T0: Entitlements = grant(baseEntitlements(), ['finance.bookkeeping'], {
  products: 50,
  members: 1,
});

// T1 — Social Commerce: FB/IG + inbox (messages/comments), auto-reply + manual escalation,
// order confirmation, revenue/expense/profit, daily/weekly calendar, cloud sync.
// EXCLUDES finance.insights + finance.performance_suggestions (on hold).
const T1: Entitlements = grant(
  { ...T0 },
  [
    ...booleanKeysOf(T0),
    'finance.revenue_expense_profit',
    'social.facebook',
    'social.instagram',
    'social.inbox',
    'social.auto_reply',
    'social.manual_escalation',
    'orders.confirmation',
    'calendar.daily_weekly',
    'sync.cloud',
    'members.invite',
  ],
  { products: 300, members: 2 },
);

// T2 — Commerce: website integration, inventory, courier.
const T2: Entitlements = grant(
  { ...T1 },
  [
    ...booleanKeysOf(T1),
    'website.integration',
    'inventory.management',
    'courier.integration',
    'members.roles',
  ],
  { products: 2000, members: 5 },
);

// T3 — CRM & Growth: leads, customer DB, scoring, upsell/cross-sell.
const T3: Entitlements = grant(
  { ...T2 },
  [
    ...booleanKeysOf(T2),
    'crm.lead_capture',
    'crm.customer_db',
    'crm.lead_scoring',
    'growth.upsell',
    'growth.crosssell',
  ],
  { products: 10000, members: 15 },
);

// T4 — Business Intelligence: dashboards, summaries, analytics. (ai.lead_closing is on hold.)
const T4: Entitlements = grant(
  { ...T3 },
  [...booleanKeysOf(T3), 'reports.dashboard', 'reports.summaries', 'analytics.tracking'],
  { products: UNLIMITED, members: UNLIMITED },
);

export const TIER_ENTITLEMENTS: Record<Tier, Entitlements> = {
  t0: T0,
  t1: T1,
  t2: T2,
  t3: T3,
  t4: T4,
};
