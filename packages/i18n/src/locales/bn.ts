export const bn = {
  common: { appName: 'আরোপন', save: 'সংরক্ষণ', cancel: 'বাতিল', loading: 'লোড হচ্ছে…' },
  auth: {
    phoneLabel: 'মোবাইল নম্বর',
    requestOtp: 'কোড পাঠান',
    otpLabel: 'যাচাই কোড',
    verify: 'যাচাই করুন',
  },
  nav: {
    finance: 'হিসাব',
    orders: 'অর্ডার',
    inbox: 'বার্তা',
    calendar: 'ক্যালেন্ডার',
    brandStudio: 'ব্র্যান্ড স্টুডিও',
    settings: 'সেটিংস',
  },
  finance: {
    income: 'আয়',
    expense: 'খরচ',
    balance: 'ব্যালেন্স',
    profit: 'লাভ',
    addTransaction: 'লেনদেন যোগ করুন',
  },
  tier: {
    t0: 'অফলাইন',
    t1: 'সোশ্যাল কমার্স',
    t2: 'কমার্স',
    t3: 'সিআরএম ও গ্রোথ',
    t4: 'বিজনেস ইন্টেলিজেন্স',
  },
  gate: { locked: 'এই ফিচারটি আপনার প্যাকেজে নেই', upgrade: 'আপগ্রেড করুন' },
} as const;

/** Widen literal string leaves to `string` so other locales can supply their own text. */
type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
export type TranslationResources = Widen<typeof bn>;
