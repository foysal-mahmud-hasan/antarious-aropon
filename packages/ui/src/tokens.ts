/**
 * Canonical design tokens (framework-agnostic). The Tamagui config in `tamagui.config.ts`
 * consumes these; nothing in the app should hardcode hex/spacing — import from here or use
 * the Tamagui `$token` shorthands. Source: .claude/design/design-tokens.md.
 */

export const palette = {
  // brand
  primary: '#0e7490',
  primary2: '#22b8cf',
  secondary: '#0891b2',
  accent: '#155e75',
  accent2: '#67e8f9',
  // surfaces
  bg: '#ecfeff',
  bg2: '#f0fdfa',
  surface: '#ffffff',
  chipBg: '#cffafe',
  // text
  textPrimary: '#083344',
  textSecondary: '#5f8a96',
  textInverse: '#ffffff',
  // semantic
  income: '#14b8a6',
  incomeLight: '#ccfbf1',
  expense: '#fb7185',
  expenseLight: '#ffe4e6',
  warning: '#22b8cf',
  info: '#0891b2',
  aiBg: '#def7fb',
  // lines
  border: '#a5f3fc',
  borderLight: '#cffafe',
  // dark
  darkBg: '#0d2d38',
  darkSurface: '#142e3a',
  darkText: '#ecfeff',
  darkPrimary: '#22b8cf',
  white: '#ffffff',
  black: '#000000',
} as const;

/** Per-tier accent colors (T0–T4). */
export const tierColors = {
  t0: '#5f8a96',
  t1: '#22b8cf',
  t2: '#0891b2',
  t3: '#0e7490',
  t4: '#155e75',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 14,
  lg: 18,
  xl: 22,
  xl2: 28,
  xl3: 36,
  xl4: 44,
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl2: 24,
  btn: 16,
  full: 9999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  xl2: 24,
  xl3: 28,
  xl4: 34,
} as const;

/** Breakpoints — the adaptive shell switches from bottom-tabs to sidebar at `lg` (900). */
export const breakpoints = {
  sm: 0,
  md: 640,
  lg: 900,
  xl: 1280,
} as const;

export const motion = {
  duration: 340,
  stagger: 50,
  spring: { stiffness: 280, damping: 18, mass: 0.8 },
} as const;
