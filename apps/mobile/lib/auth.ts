import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type Locale = 'bn' | 'en';

interface AuthState {
  userId?: string;
  token?: string;
  orgId?: string;
  tier?: string;
  locale: Locale;
  hydrated: boolean;
  signIn: (p: { userId: string; token: string; orgId: string }) => void;
  setOrg: (orgId: string) => void;
  setTier: (tier: string) => void;
  setLocale: (locale: Locale) => void;
  signOut: () => void;
}

/**
 * Auth/session store, persisted so testers stay logged in across reloads (localStorage on web,
 * AsyncStorage on native). `hydrated` flips true once the persisted state is rehydrated.
 */
export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      locale: 'bn',
      hydrated: false,
      signIn: ({ userId, token, orgId }) => set({ userId, token, orgId }),
      setOrg: (orgId) => set({ orgId }),
      setTier: (tier) => set({ tier }),
      setLocale: (locale) => set({ locale }),
      signOut: () => set({ userId: undefined, token: undefined, orgId: undefined, tier: undefined }),
    }),
    {
      name: 'aropon-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        userId: s.userId,
        token: s.token,
        orgId: s.orgId,
        tier: s.tier,
        locale: s.locale,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
