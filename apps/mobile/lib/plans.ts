/**
 * Plan catalog (offering + pricing) shown on the Plans screen. `adds` = the capabilities each tier
 * INTRODUCES (tiers are cumulative), so a higher tier's `adds` is exactly "what's new" at that step.
 * Prices are the brief's BDT ranges. `live` = built today (T0/T1); T2–T4 are "coming soon".
 */
export type PlanTier = 't0' | 't1' | 't2' | 't3' | 't4';

export interface Plan {
  id: PlanTier;
  name: string;
  price: string;
  emoji: string;
  live: boolean;
  adds: string[];
}

export const PLANS: Plan[] = [
  {
    id: 't0',
    name: 'অফলাইন মোড',
    price: '৳২০০',
    emoji: '🧾',
    live: true,
    adds: ['বেসিক বুককিপিং — আয়, ব্যয়, ব্যালেন্স ও লেনদেনের ইতিহাস'],
  },
  {
    id: 't1',
    name: 'সোশ্যাল কমার্স',
    price: '৳৭০০–৮০০',
    emoji: '🛍️',
    live: true,
    adds: [
      'ফেসবুক ও ইনস্টাগ্রাম ইনবক্স (মেসেজ ও কমেন্ট)',
      'অটো-রিপ্লাই ও ম্যানুয়াল এস্কেলেশন',
      'অর্ডার কনফার্মেশন সিস্টেম',
      'আয়, ব্যয় ও লাভ ট্র্যাকিং',
      'দৈনিক ও সাপ্তাহিক ক্যালেন্ডার',
    ],
  },
  {
    id: 't2',
    name: 'কমার্স',
    price: '৳১৫০০–১৭০০',
    emoji: '🌐',
    live: false,
    adds: ['ওয়েবসাইট ইন্টিগ্রেশন ও অর্ডার ভিজিবিলিটি', 'ইনভেন্টরি ব্যবস্থাপনা', 'কুরিয়ার ইন্টিগ্রেশন'],
  },
  {
    id: 't3',
    name: 'সিআরএম ও গ্রোথ',
    price: '৳৩০০০–৩৫০০',
    emoji: '🎯',
    live: false,
    adds: ['লিড ক্যাপচার ও কাস্টমার ডাটাবেস', 'লিড স্কোরিং', 'আপসেল ও ক্রস-সেল অটোমেশন'],
  },
  {
    id: 't4',
    name: 'বিজনেস ইন্টেলিজেন্স',
    price: '৳৫০০০–৭০০০',
    emoji: '📊',
    live: false,
    adds: [
      'ড্যাশবোর্ড ও দৈনিক/সাপ্তাহিক/মাসিক রিপোর্ট',
      'অ্যানালিটিক্স — বেস্ট/ওয়ার্স্ট সেলার, পিক আওয়ার',
      'এআই লিড-ক্লোজিং সাপোর্ট',
    ],
  },
];

export function tierIndex(tier: PlanTier): number {
  return PLANS.findIndex((p) => p.id === tier);
}

/** Everything included at a tier (cumulative). */
export function cumulativeFeatures(tier: PlanTier): string[] {
  const i = tierIndex(tier);
  return PLANS.slice(0, i + 1).flatMap((p) => p.adds);
}
