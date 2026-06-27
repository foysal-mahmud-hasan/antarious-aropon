import { create } from 'zustand';

type Locale = 'bn' | 'en';

interface AuthState {
  userId?: string;
  token?: string;
  orgId?: string;
  locale: Locale;
  signIn: (p: { userId: string; token: string }) => void;
  setOrg: (orgId: string) => void;
  setLocale: (locale: Locale) => void;
  signOut: () => void;
}

/** Minimal client auth/session store. Tokens come from Supabase Auth (wired in implementation). */
export const useAuth = create<AuthState>((set) => ({
  locale: 'bn',
  signIn: ({ userId, token }) => set({ userId, token }),
  setOrg: (orgId) => set({ orgId }),
  setLocale: (locale) => set({ locale }),
  signOut: () => set({ userId: undefined, token: undefined, orgId: undefined }),
}));
