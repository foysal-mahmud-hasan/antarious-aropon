import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { bn, en } from '@aropon/i18n';

// Bengali-first; English fallback. Resources are the shared catalogs from @aropon/i18n.
void i18next.use(initReactI18next).init({
  lng: 'bn',
  fallbackLng: 'en',
  resources: {
    bn: { translation: bn },
    en: { translation: en },
  },
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18next;
