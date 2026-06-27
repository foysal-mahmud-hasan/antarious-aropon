import type { TranslationResources } from './bn';

export const en: TranslationResources = {
  common: { appName: 'Aropon', save: 'Save', cancel: 'Cancel', loading: 'Loading…' },
  auth: {
    phoneLabel: 'Mobile number',
    requestOtp: 'Send code',
    otpLabel: 'Verification code',
    verify: 'Verify',
  },
  nav: {
    finance: 'Finance',
    inbox: 'Inbox',
    calendar: 'Calendar',
    brandStudio: 'Brand Studio',
    settings: 'Settings',
  },
  finance: {
    income: 'Income',
    expense: 'Expense',
    balance: 'Balance',
    profit: 'Profit',
    addTransaction: 'Add transaction',
  },
  tier: {
    t0: 'Offline',
    t1: 'Social Commerce',
    t2: 'Commerce',
    t3: 'CRM & Growth',
    t4: 'Business Intelligence',
  },
  gate: { locked: 'This feature is not in your plan', upgrade: 'Upgrade' },
};
