# Aropon Design System — Tokens

> **Source of truth** for the `packages/ui` Tamagui theme. Every color, size, space,
> radius, shadow, and motion value an Aropon surface uses lives here. Components must
> reference these tokens by name — **never** hardcode a hex, px, or ms value.

Aropon is a **mobile-first**, **Bengali-first** SaaS for Bangladeshi MSMEs, built with
**Expo + React Native Web + Tamagui**. The visual language is teal/cyan, rounded-card,
friendly-professional. Tamagui is the single styling engine: tokens compile to CSS
variables on web and to native StyleSheet values on iOS/Android, so one token catalog
drives every platform.

---

## 1. Token philosophy

| Rule | Why |
| --- | --- |
| **Reference tokens, never literals.** | A component using `$color.primary` re-themes for free (dark mode, white-label) and stays consistent. |
| **Semantic over raw.** | Prefer `income` / `expense` / `surface` over `teal500`. Intent survives a palette change. |
| **Tokens are typed.** | Tamagui generates TS types from the config, so `$space.lg` autocompletes and typos fail at compile time. |
| **4px spatial grid.** | All spacing/radius derive from a 4px base for visual rhythm. |
| **One scale per concern.** | Color, space, size, radius, zIndex are separate token groups; don't cross-wire them. |

---

## 2. Color tokens

### 2.1 Light theme (default)

| Token | Hex | Role |
| --- | --- | --- |
| `primary` | `#0e7490` | Primary brand teal — primary buttons, active states, key accents |
| `primary2` | `#22b8cf` | Lighter brand cyan — gradients, hovers, highlights |
| `secondary` | `#0891b2` | Secondary actions, links, mid-gradient stop |
| `accent` | `#155e75` | Deep accent — emphasis, dark chips, T4 tier |
| `accent2` | `#67e8f9` | Bright cyan accent — focus glow, decorative |
| `bg` | `#ecfeff` | App background (cyan-tinted) |
| `bg2` | `#f0fdfa` | Alternate background (teal-tinted), soft-gradient end |
| `surface` | `#ffffff` | Card / sheet / input surface |
| `chipBg` | `#cffafe` | Chip & tag background |
| `textPrimary` | `#083344` | Primary text (deep navy-teal) |
| `textSecondary` | `#5f8a96` | Secondary / supporting text |
| `textTertiary` | `#5f8a96` | Tertiary / hint text (alias of secondary tone) |
| `textInverse` | `#ffffff` | Text on dark/colored surfaces |
| `success` / `income` | `#14b8a6` | Positive / income amounts |
| `successLight` | `#ccfbf1` | Success background wash |
| `error` / `expense` | `#fb7185` | Negative / expense amounts |
| `errorLight` | `#ffe4e6` | Error background wash |
| `warning` | `#22b8cf` | Warning / caution |
| `warningLight` | `#cffafe` | Warning background wash |
| `info` | `#0891b2` | Informational |
| `border` | `#a5f3fc` | Default border / divider |
| `borderLight` | `#cffafe` | Subtle border, inner hairlines |
| `aiBg` | `#def7fb` | AI-surfaced content background (assistant cards) |
| `overlay` | `rgba(8,51,68,0.45)` | Modal / sheet scrim |
| `ripple` | `rgba(14,116,144,0.2)` | Touch ripple |

### 2.2 Dark theme (overrides)

Only the values below change in dark mode; everything else is derived from these by the
theme builder (e.g. `border` darkens, `textSecondary` lightens).

| Token | Light | Dark |
| --- | --- | --- |
| `primary` | `#0e7490` | `#22b8cf` |
| `bg` | `#ecfeff` | `#0d2d38` |
| `surface` | `#ffffff` | `#142e3a` |
| `textPrimary` | `#083344` | `#ecfeff` |

> Dark mode brightens `primary` (so it reads on a dark bg) and inverts the bg/surface/text
> trio. Semantic tokens (`income`, `expense`, …) keep their hue but the theme builder nudges
> lightness for AA contrast on dark surfaces.

### 2.3 Tier colors

Subscription / capability tiers T0–T4. Used for `TierGate`, tier badges, plan cards.

| Tier | Token | Hex | Feel |
| --- | --- | --- | --- |
| T0 (Free) | `tier0` | `#5f8a96` | Muted slate-teal |
| T1 | `tier1` | `#22b8cf` | Bright cyan |
| T2 | `tier2` | `#0891b2` | Secondary teal |
| T3 | `tier3` | `#0e7490` | Primary teal |
| T4 (Top) | `tier4` | `#155e75` | Deep accent |

Tiers ascend in **depth** (lighter → deeper) so a higher plan visually reads as "more
premium." Use `tierN` only for tier identity (badge bg, gate accent), not general UI.

---

## 3. Gradients

| Token | Stops | Direction | Use |
| --- | --- | --- | --- |
| `gradientHero` | `#0e7490 → #0891b2 → #22d3ee` | Diagonal (135°) | Hero headers, onboarding, dashboard banner |
| `gradientButton` | `#0e7490 → #0891b2` | Horizontal (90°) | Primary CTA fill |
| `gradientSoft` | `#ecfeff → #f0fdfa` | Vertical (180°) | Page / section background wash |

Implement via `expo-linear-gradient` (native + web). Wrap in a `<Gradient name="hero" />`
primitive so the stops stay token-driven, not inlined per screen.

```tsx
const gradients = {
  hero:   { colors: ['#0e7490', '#0891b2', '#22d3ee'], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  button: { colors: ['#0e7490', '#0891b2'],            start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },
  soft:   { colors: ['#ecfeff', '#f0fdfa'],            start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
} as const
```

---

## 4. Typography

**Bengali-first.** Most product copy is Bangla; Latin (digits-in-some-contexts, brand
words, code) is secondary.

### 4.1 Font families

| Token | Family | Notes |
| --- | --- | --- |
| `bengali` | **Noto Sans Bengali** | Full weight range **400–800**. This is the key upgrade over the reference app, which used single-weight TiroBangla — we now get real weight contrast (regular body vs. bold headings) in Bangla. |
| `latin` | **Be Vietnam Pro** | Latin / numerals where Latin glyphs are wanted; fallbacks `Inter`, system. |
| `body` | → `bengali` | Default body family. |
| `heading` | → `bengali` | Default heading family. |

Load both via `expo-font` (and `@expo/font` web `<link>`), register weights 400/500/600/700
(and 800 for Bengali display). Be Vietnam Pro fallback chain: `'Be Vietnam Pro', Inter, -apple-system, system-ui, sans-serif`.

### 4.2 Font sizes

| Token | px | Typical use |
| --- | --- | --- |
| `xs` | 11 | Captions, legal, timestamps |
| `sm` | 13 | Secondary text, chip labels |
| `base` | 15 | Default body |
| `md` | 16 | Emphasized body, list titles |
| `lg` | 18 | Subheads |
| `xl` | 20 | Section titles |
| `2xl` | 24 | Screen titles |
| `3xl` | 28 | Page headers |
| `4xl` | 34 | Hero / display |

### 4.3 Weights & line heights

| Weight token | Value | | Line-height token | Multiplier |
| --- | --- | --- | --- | --- |
| `regular` | 400 | | `tight` | 1.15 |
| `medium` | 500 | | `normal` | 1.4 |
| `semibold` | 600 | | `relaxed` | 1.6 |
| `bold` | 700 | | | |

> **Bengali line-height:** Bangla glyphs carry tall matra (ী, ৈ) and stacked conjuncts.
> Never use `tight` (1.15) for Bangla body — descenders/ascenders clip. Use `normal` (1.4)
> for Bangla body and `relaxed` (1.6) for dense paragraphs. `tight` is reserved for large
> Latin display numerals only.

---

## 5. Spacing (4px base)

| Token | px | |
| --- | --- | --- |
| `xs` | 4 | Hairline gaps, icon-to-text |
| `sm` | 8 | Tight stacks |
| `md` | 12 | Default inner gap |
| `base` | 14 | Card padding (compact) |
| `lg` | 18 | Card padding (standard), section gap |
| `xl` | 22 | Block separation |
| `2xl` | 28 | Group separation |
| `3xl` | 36 | Screen section margins |
| `4xl` | 44 | Hero padding, large whitespace |

Negative tokens (`-md`, `-lg`, …) are auto-generated by Tamagui for pull/overlap layouts.

---

## 6. Radius

| Token | px | Use |
| --- | --- | --- |
| `sm` | 12 | Chips, small controls, inputs |
| `md` | 16 | Cards (default), buttons |
| `lg` | 20 | Large cards, sheets |
| `xl` | 20 | Sheets / modals (alias of lg scale top) |
| `2xl` | 24 | Hero cards, feature panels |
| `btn` | 16 | Button radius (semantic alias of md) |
| `full` | 9999 | Pills, avatars, FAB, StatusPill |

---

## 7. Shadows / elevation

RN and web shadows differ; define both. On web these become `box-shadow`; on native,
`shadowColor/Offset/Opacity/Radius` (+ Android `elevation`).

| Token | Offset (x/y) | Blur | Color & opacity | Use |
| --- | --- | --- | --- | --- |
| `sm` | 0 / 2 | 8 | teal `#0e7490` @ 8% | Chips, raised inputs |
| `card` | 0 / 4 | 14 | navy `#083344` @ 12% | Default card elevation |
| `soft` | 0 / 8 | 18 | navy `#083344` @ 18% | Floating cards, popovers |
| `md` | 0 / 4 | 12 | teal `#0e7490` @ 10% | Buttons (resting) |
| `lg` | 0 / 16 | 32 | navy `#083344` @ 22% | Modals, sheets (modal-level) |

```ts
const shadows = {
  sm:   { shadowColor: '#0e7490', shadowOffset: { width: 0, height: 2 },  shadowOpacity: 0.08, shadowRadius: 8,  elevation: 2 },
  card: { shadowColor: '#083344', shadowOffset: { width: 0, height: 4 },  shadowOpacity: 0.12, shadowRadius: 14, elevation: 4 },
  soft: { shadowColor: '#083344', shadowOffset: { width: 0, height: 8 },  shadowOpacity: 0.18, shadowRadius: 18, elevation: 8 },
  md:   { shadowColor: '#0e7490', shadowOffset: { width: 0, height: 4 },  shadowOpacity: 0.10, shadowRadius: 12, elevation: 3 },
  lg:   { shadowColor: '#083344', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.22, shadowRadius: 32, elevation: 16 },
}
```

---

## 8. Motion

| Token | Value | Use |
| --- | --- | --- |
| `duration` | 340 ms | Standard transition (sheets, fades, layout) |
| `rippleIn` | 180 ms | Touch ripple expand |
| `rippleOut` | 260 ms | Touch ripple fade |
| `pulse` | 1400 ms | Skeleton shimmer / live-dot pulse loop |
| `stagger` | 50 ms | Per-item delay in list entrance |
| `spring` | stiffness 280, damping 18, mass 0.8 | Press feedback, drawer, FAB |

```ts
const animations = {
  // react-native-reanimated / Tamagui animation driver
  quick:  { type: 'timing', duration: 180 },
  base:   { type: 'timing', duration: 340 },
  bouncy: { type: 'spring', stiffness: 280, damping: 18, mass: 0.8 },
  pulse:  { type: 'timing', duration: 1400, loop: true },
}
```

**Principles:** motion is functional (orient, confirm, relate), never decorative-only.
Respect `prefers-reduced-motion` on web → fall back to instant/opacity-only. Keep entrance
staggers ≤ 6 items, then batch.

---

## 9. Breakpoint tokens

Defined here as the canonical set; usage detailed in `ui-guidelines.md`. These compile to
**real CSS media queries** on web (the reference app shipped none — a key fix).

| Token | min-width | Target |
| --- | --- | --- |
| `sm` | 0 | Phone (default, mobile-first) |
| `md` | 640 | Large phone / small tablet |
| `lg` | 900 | Tablet / small desktop → sidebar shell |
| `xl` | 1280 | Desktop wide |

---

## 10. Tamagui config (skeleton)

```ts
// packages/ui/src/tokens.ts
import { createTokens } from '@tamagui/core'

export const tokens = createTokens({
  color: {
    primary: '#0e7490', primary2: '#22b8cf', secondary: '#0891b2',
    accent: '#155e75', accent2: '#67e8f9',
    bg: '#ecfeff', bg2: '#f0fdfa', surface: '#ffffff', chipBg: '#cffafe',
    textPrimary: '#083344', textSecondary: '#5f8a96', textTertiary: '#5f8a96',
    textInverse: '#ffffff',
    success: '#14b8a6', successLight: '#ccfbf1',
    error: '#fb7185', errorLight: '#ffe4e6',
    warning: '#22b8cf', warningLight: '#cffafe', info: '#0891b2',
    border: '#a5f3fc', borderLight: '#cffafe', aiBg: '#def7fb',
    overlay: 'rgba(8,51,68,0.45)', ripple: 'rgba(14,116,144,0.2)',
    tier0: '#5f8a96', tier1: '#22b8cf', tier2: '#0891b2', tier3: '#0e7490', tier4: '#155e75',
  },
  space: { xs: 4, sm: 8, md: 12, base: 14, lg: 18, xl: 22, '2xl': 28, '3xl': 36, '4xl': 44, true: 14 },
  size:  { xs: 4, sm: 8, md: 12, base: 14, lg: 18, xl: 22, '2xl': 28, '3xl': 36, '4xl': 44, true: 14 },
  radius:{ sm: 12, md: 16, lg: 20, xl: 20, '2xl': 24, btn: 16, full: 9999, true: 16 },
  zIndex:{ base: 0, card: 10, sticky: 100, nav: 200, overlay: 900, modal: 1000, toast: 1100 },
})
```

```ts
// packages/ui/src/themes.ts
import { createTheme } from '@tamagui/core'

const light = createTheme({
  background: tokens.color.bg,
  backgroundStrong: tokens.color.surface,
  color: tokens.color.textPrimary,
  colorSecondary: tokens.color.textSecondary,
  borderColor: tokens.color.border,
  primary: tokens.color.primary,
  income: tokens.color.success,
  expense: tokens.color.error,
})

const dark = createTheme({
  background: '#0d2d38',
  backgroundStrong: '#142e3a',
  color: '#ecfeff',
  colorSecondary: '#9fc6d0',
  borderColor: '#1f4a5a',
  primary: '#22b8cf',
  income: tokens.color.success,
  expense: tokens.color.error,
})

export const themes = { light, dark }
```

```ts
// packages/ui/src/config.ts
import { createTamagui } from '@tamagui/core'
import { createMedia } from '@tamagui/react-native-media-driver'

export const media = createMedia({
  sm: { minWidth: 0 },
  md: { minWidth: 640 },
  lg: { minWidth: 900 },
  xl: { minWidth: 1280 },
})

export const config = createTamagui({
  tokens, themes, media, animations,
  fonts: { body: bengaliFont, heading: bengaliFont, latin: beVietnamFont },
  defaultFont: 'body',
})
export type AppConfig = typeof config
declare module '@tamagui/core' { interface TamaguiCustomConfig extends AppConfig {} }
```

The `font` object maps the size/lineHeight/weight tables above into Tamagui `createFont`
(`size`, `lineHeight`, `weight`, `face` per weight). Keep the named keys (`xs`…`4xl`) so
`<Text size="$lg">` resolves directly.

---

## 11. Token usage quick-reference

| Want | Use |
| --- | --- |
| Card background | `surface` (theme `backgroundStrong`) |
| Page background | `bg` / `gradientSoft` |
| Money in | `income` (`#14b8a6`) |
| Money out | `expense` (`#fb7185`) |
| Default padding | `$lg` (18) |
| Card corners | `$radius.md` (16) |
| Pill / avatar | `$radius.full` |
| Default elevation | shadow `card` |
| Primary CTA | `gradientButton` + shadow `md` |
| AI / assistant card | `aiBg` + border `borderLight` |
