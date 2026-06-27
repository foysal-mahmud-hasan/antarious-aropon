/** Default bookkeeping categories (Bengali). Used by the add-transaction form. */
export const INCOME_CATEGORIES = ['বিক্রয়', 'অগ্রিম', 'অন্যান্য আয়'] as const;

export const EXPENSE_CATEGORIES = [
  'কেনাকাটা',
  'ভাড়া',
  'বেতন',
  'পরিবহন',
  'ইউটিলিটি',
  'অন্যান্য খরচ',
] as const;

export const CATEGORIES = {
  income: INCOME_CATEGORIES,
  expense: EXPENSE_CATEGORIES,
} as const;

export type TransactionType = keyof typeof CATEGORIES;
