import { createFont, createTamagui, createTokens } from '@tamagui/core';
import { palette, radius as rad, space as sp } from './src/tokens';

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

// Bengali-first font stack. Real weights (Noto Sans Bengali ships 400–800), unlike the reference.
const body = createFont({
  family: 'Noto Sans Bengali, Be Vietnam Pro, system-ui, sans-serif',
  size: { 1: 11, 2: 13, 3: 15, 4: 16, 5: 18, 6: 20, 7: 24, 8: 28, 9: 34, true: 15 },
  lineHeight: { 1: 15, 2: 18, 3: 21, 4: 22, 5: 26, 6: 28, 7: 32, 8: 38, 9: 46, true: 21 },
  weight: { 4: '400', 5: '500', 6: '600', 7: '700' },
  face: {},
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
  secondary: palette.secondary,
  income: palette.income,
  expense: palette.expense,
  shadowColor: palette.textPrimary,
};

const dark = {
  background: palette.darkBg,
  backgroundStrong: palette.darkSurface,
  backgroundPress: palette.darkSurface,
  color: palette.darkText,
  colorSecondary: palette.textSecondary,
  colorInverse: palette.textPrimary,
  borderColor: palette.darkSurface,
  borderColorHover: palette.darkPrimary,
  primary: palette.darkPrimary,
  secondary: palette.primary2,
  income: palette.income,
  expense: palette.expense,
  shadowColor: palette.black,
};

export const config = createTamagui({
  tokens,
  themes: { light, dark },
  defaultFont: 'body',
  fonts: { body, heading: body },
  // Compile to real CSS media queries on web — this is what makes the adaptive shell responsive.
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
