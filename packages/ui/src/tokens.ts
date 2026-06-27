/**
 * Canonical design tokens — Antarious brand (from antarious-studio.html, "antarious" mood).
 * Brand blue #27a7e1. Nothing in the app should hardcode hex — import from here or use Tamagui
 * `$token` shorthands.
 */

export const palette = {
  // brand
  primary: '#27a7e1',
  primary2: '#6fc4ec',
  accent: '#1f87b8',
  accent2: '#a8dbf4',
  // surfaces
  bg: '#eef8fd',
  bg2: '#f3fbff',
  surface: '#ffffff',
  chipBg: '#d3edfa',
  chipInk: '#1976a3',
  // text
  textPrimary: '#0f3a52',
  textSecondary: '#6b94a8',
  textInverse: '#ffffff',
  // semantic
  income: '#16b886',
  incomeLight: '#d2f3e8',
  expense: '#ff5a78',
  expenseLight: '#ffe0e6',
  warning: '#f59e0b',
  info: '#1f87b8',
  aiBg: '#e3f4fc',
  aiAccent: '#1f87b8',
  // lines + orbs
  border: '#cfe9f7',
  borderLight: '#e3f4fc',
  orb1: '#a8dbf4',
  orb2: '#c9e9f7',
  // brand shades
  brand: '#27a7e1',
  brand100: '#d4ecf9',
  brand300: '#86c8ec',
  brand700: '#1c7099',
  // dark
  darkBg: '#0e1027',
  darkSurface: '#1e1b3a',
  darkText: '#ece9ff',
  darkPrimary: '#6fc4ec',
  white: '#ffffff',
  black: '#000000',
} as const;

/** Per-tier accent colors (Antarious-aligned). */
export const tierColors = {
  t0: '#6b94a8',
  t1: '#27a7e1',
  t2: '#1f87b8',
  t3: '#1976a3',
  t4: '#0f3a52',
} as const;

/** Hero gradient (diagonal 135deg) — used by HeroCard / primary buttons. */
export const gradients = {
  hero: ['#27a7e1', '#4fb8e8', '#8fd2f0'] as const,
  income: ['#16b886', '#5ed8a8'] as const,
  expense: ['#ff5a78', '#ff8fa3'] as const,
  angle: 135,
};

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

/** Breakpoints — adaptive shell switches to sidebar at `lg` (900). */
export const breakpoints = {
  sm: 0,
  md: 640,
  lg: 900,
  xl: 1280,
} as const;

export const motion = {
  duration: 340,
  stagger: 55,
  spring: { stiffness: 250, damping: 20, mass: 0.9 },
} as const;
