import { createAnimations } from '@tamagui/animations-react-native';
import { createFont, createTamagui, createTokens } from '@tamagui/core';
import { palette, radius as rad } from './src/tokens';

const size = {
  0: 0,
  xs: 4,
  sm: 8,
  md: 12,
  base: 14,
  lg: 18,
  xl: 22,
  xl2: 28,
  xl3: 36,
  xl4: 44,
  true: 14,
};
const space = { ...size, true: 14 };

const tokens = createTokens({
  color: { ...palette },
  space,
  size,
  radius: { 0: 0, sm: rad.sm, md: rad.md, lg: rad.lg, xl2: rad.xl2, btn: rad.btn, full: rad.full, true: rad.md },
  zIndex: { 0: 0, 1: 100, 2: 200, 3: 300 },
});

// Bengali-first font: Hind Siliguri (clean), loaded via @expo-google-fonts/hind-siliguri.
const body = createFont({
  family: 'HindSiliguri_400Regular, system-ui, sans-serif',
  size: { 1: 11, 2: 13, 3: 15, 4: 16, 5: 18, 6: 20, 7: 24, 8: 28, 9: 34, true: 15 },
  lineHeight: { 1: 16, 2: 19, 3: 22, 4: 23, 5: 27, 6: 29, 7: 33, 8: 38, 9: 46, true: 22 },
  weight: { 4: '400', 5: '500', 6: '600', 7: '700' },
  face: {
    300: { normal: 'HindSiliguri_300Light' },
    400: { normal: 'HindSiliguri_400Regular' },
    500: { normal: 'HindSiliguri_500Medium' },
    600: { normal: 'HindSiliguri_600SemiBold' },
    700: { normal: 'HindSiliguri_700Bold' },
  },
});

const light = {
  background: palette.bg,
  backgroundStrong: palette.surface,
  backgroundPress: palette.chipBg,
  color: palette.textPrimary,
  colorSecondary: palette.textSecondary,
  colorInverse: palette.textInverse,
  borderColor: palette.border,
  borderColorHover: palette.primary,
  primary: palette.primary,
  primary2: palette.primary2,
  secondary: palette.accent,
  accent: palette.accent,
  income: palette.income,
  expense: palette.expense,
  warning: palette.warning,
  chip: palette.chipBg,
  chipInk: palette.chipInk,
  ai: palette.aiAccent,
  aiBg: palette.aiBg,
  shadowColor: '#0f3a52',
};

const dark = {
  background: palette.darkBg,
  backgroundStrong: palette.darkSurface,
  backgroundPress: '#2a2750',
  color: palette.darkText,
  colorSecondary: '#9890c4',
  colorInverse: palette.textPrimary,
  borderColor: '#2a2750',
  borderColorHover: palette.darkPrimary,
  primary: palette.darkPrimary,
  primary2: palette.primary2,
  secondary: palette.accent2,
  accent: palette.accent2,
  income: palette.income,
  expense: palette.expense,
  warning: palette.warning,
  chip: '#2a2750',
  chipInk: palette.primary2,
  ai: palette.darkPrimary,
  aiBg: '#221f44',
  shadowColor: '#000000',
};

const animations = createAnimations({
  quick: { type: 'spring', damping: 20, stiffness: 250 },
  bouncy: { type: 'spring', damping: 12, stiffness: 200 },
  slow: { type: 'spring', damping: 18, stiffness: 120 },
});

export const config = createTamagui({
  tokens,
  themes: { light, dark },
  defaultFont: 'body',
  fonts: { body, heading: body },
  animations,
  // Compile to real CSS media queries on web — powers the adaptive shell.
  media: {
    sm: { maxWidth: 639 },
    md: { minWidth: 640 },
    gtSm: { minWidth: 640 },
    lg: { minWidth: 900 },
    gtMd: { minWidth: 900 },
    xl: { minWidth: 1280 },
  },
  settings: {
    allowedStyleValues: 'somewhat-strict',
  },
});

export type AppConfig = typeof config;

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
