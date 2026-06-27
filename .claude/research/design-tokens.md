# Design Tokens — Antarious brand

> Source of truth: `~/Downloads/antarious-studio.html` (the design studio), **"antarious" mood**.
> Brand blue **#27a7e1**, font **Hind Siliguri**, style **full-playful** (emoji icons, confetti on
> CTAs, gradient hero cards, blob/bounce/pulse motion). The live tokens live in
> `packages/ui/src/tokens.ts` + `packages/ui/tamagui.config.ts`; this file documents them.
>
> (Earlier the app used a teal "ocean" palette — replaced by Antarious blue.)

## Colors — Light

| Token | Hex | Use |
|-------|-----|-----|
| primary | `#27a7e1` | Brand, gradients, primary buttons, active nav |
| primary2 | `#6fc4ec` | Secondary brand / dark-mode primary |
| accent | `#1f87b8` | Accent / secondary solid button |
| accent2 | `#a8dbf4` | Light accent |
| bg | `#eef8fd` | Page background |
| bg2 | `#f3fbff` | Secondary background |
| surface / card | `#ffffff` | Cards, elevated surfaces |
| chipBg | `#d3edfa` | Chip / input background |
| chipInk | `#1976a3` | Chip text |
| textPrimary (ink) | `#0f3a52` | Body text, headings |
| textSecondary (muted) | `#6b94a8` | Secondary text |
| income | `#16b886` | Income, positive |
| expense | `#ff5a78` | Expense, negative, danger |
| warning | `#f59e0b` | Warning |
| ai | `#1f87b8` | AI accent |
| aiBg | `#e3f4fc` | AI callout background |
| border | `#cfe9f7` | Borders |
| orb1 / orb2 | `#a8dbf4` / `#c9e9f7` | Background blob orbs |

## Brand shades
`#27a7e1` → 100 `#d4ecf9` · 300 `#86c8ec` · 700 `#1c7099`

## Colors — Dark
primary `#6fc4ec` · bg `#0e1027` · surface `#1e1b3a` · text `#ece9ff`

## Tier colors
T0 `#6b94a8` · T1 `#27a7e1` · T2 `#1f87b8` · T3 `#1976a3` · T4 `#0f3a52`

## Gradients
- **hero** (diagonal 135°): `#27a7e1 → #4fb8e8 → #8fd2f0` — HeroCard + primary buttons
- **income**: `#16b886 → #5ed8a8` · **expense**: `#ff5a78 → #ff8fa3`

## Typography
- Font: **Hind Siliguri** (`@expo-google-fonts/hind-siliguri`), weights 300/400/500/600/700.
- Sizes (px): xs 11 · sm 13 · base 15 · md 16 · lg 18 · xl 20 · 2xl 24 · 3xl 28 · 4xl 34
- Bengali numerals (০-৯) + ৳ formatting via `@aropon/i18n`.

## Spacing (4px base)
xs 4 · sm 8 · md 12 · base 14 · lg 18 · xl 22 · 2xl 28 · 3xl 36 · 4xl 44

## Radius
sm 12 · md 16 · lg 20 · 2xl 24 · btn 16 · full 9999

## Breakpoints (adaptive shell → sidebar at lg)
sm 0 · md 640 · lg 900 · xl 1280

## Motion / playful
- Entrance stagger, tap-scale (`pressStyle`), hover-lift on web.
- **Blob orbs** background, **bounce** on active nav, **pulse** on AI badge.
- **Confetti** burst on primary/income CTAs (`fireConfetti()` + `<ConfettiHost/>`).
- Emoji icons (nav + tool grids): 📒 হিসাব · 📦 অর্ডার · 💬 বার্তা · 📅 ক্যালেন্ডার · ⚙️ সেটিংস.

## Key components (`packages/ui`)
`HeroCard` (gradient) · `AICallout` · `ToolGrid` · `TierChip` · `Button` (gradient + confetti) ·
`Card` · `MetricCard` · `Chip` · `StatusPill` · `Input` · `TierGate` · `AdaptiveShell` (tabs↔sidebar).
