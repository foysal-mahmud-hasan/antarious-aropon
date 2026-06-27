import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

type Locale = 'bn' | 'en';
const KEY = 'aropon-auth';

interface AuthState {
  userId?: string;
  token?: string;
  orgId?: string;
  tier?: string;
  locale: Locale;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  signIn: (p: { userId: string; token: string; orgId: string }) => void;
  setOrg: (orgId: string) => void;
  setTier: (tier: string) => void;
  setLocale: (locale: Locale) => void;
  signOut: () => void;
}

type Persisted = Pick<AuthState, 'userId' | 'token' | 'orgId' | 'tier' | 'locale'>;

/**
 * Auth/session store with manual AsyncStorage persistence (localStorage on web). We persist by
 * hand rather than via `zustand/middleware` because that barrel pulls in devtools code containing
 * `import.meta`, which breaks Metro's web (classic-script) bundle.
 */
export const useAuth = create<AuthState>((set, get) => {
  const save = () => {
    const s = get();
    const data: Persisted = {
      userId: s.userId,
      token: s.token,
      orgId: s.orgId,
      tier: s.tier,
      locale: s.locale,
    };
    void AsyncStorage.setItem(KEY, JSON.stringify(data));
  };

  return {
    locale: 'bn',
    hydrated: false,
    hydrate: async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const s = JSON.parse(raw) as Persisted;
          set({
            userId: s.userId,
            token: s.token,
            orgId: s.orgId,
            tier: s.tier,
            locale: s.locale ?? 'bn',
          });
        }
      } catch {
        // ignore corrupt storage
      } finally {
        set({ hydrated: true });
      }
    },
    signIn: ({ userId, token, orgId }) => {
      set({ userId, token, orgId });
      save();
    },
    setOrg: (orgId) => {
      set({ orgId });
      save();
    },
    setTier: (tier) => {
      set({ tier });
      save();
    },
    setLocale: (locale) => {
      set({ locale });
      save();
    },
    signOut: () => {
      set({ userId: undefined, token: undefined, orgId: undefined, tier: undefined });
      save();
    },
  };
});
