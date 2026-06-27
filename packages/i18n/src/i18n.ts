import i18next, { type i18n } from 'i18next';
import { bn } from './locales/bn';
import { en } from './locales/en';
import type { Locale } from './format';

export const DEFAULT_LOCALE: Locale = 'bn';
export const SUPPORTED_LOCALES: Locale[] = ['bn', 'en'];

/** Create an isolated i18next instance (Bengali default, English fallback). */
export async function createI18n(lng: Locale = DEFAULT_LOCALE): Promise<i18n> {
  const instance = i18next.createInstance();
  await instance.init({
    lng,
    fallbackLng: 'en',
    resources: {
      bn: { translation: bn },
      en: { translation: en },
    },
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return instance;
}
