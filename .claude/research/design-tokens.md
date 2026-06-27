# Design Tokens — extracted from the design reference

> Source: https://aropon.antarious.com/ (the design reference). These tokens were reverse-engineered
> from the reference's compiled theme and are the **verbatim seed** for the new `packages/ui` Tamagui
> theme. The canonical, documented version lives in [`../design/design-system.md`](../design/design-system.md);
> this file preserves the raw extraction for traceability.
>
> **Deliberate improvement over the reference:** the reference loaded a **single-weight** Bengali font
> (TiroBangla 400) and faked bold via opacity. We adopt **Noto Sans Bengali (weights 400–800)** so weight
> variation is real. Everything else below is carried forward.

## Colors — Light theme

| Token | Hex | Use |
|-------|-----|-----|
| primary | `#0e7490` | Brand, primary buttons, links |
| primary2 | `#22b8cf` | Secondary primary / highlights |
| secondary | `#0891b2` | Secondary brand |
| accent | `#155e75` | Accent elements |
| accent2 | `#67e8f9` | Light accent |
| bg | `#ecfeff` | Page background |
| bg2 | `#f0fdfa` | Secondary background |
| surface | `#ffffff` | Cards, elevated surfaces |
| chipBg | `#cffafe` | Chip/tag/input background |
| textPrimary | `#083344` | Body text, headings |
| textSecondary | `#5f8a96` | Secondary text, labels |
| textTertiary | `#5f8a96` | Hints, timestamps |
| textInverse | `#ffffff` | Text on dark/brand surfaces |
| success / income | `#14b8a6` | Income, positive |
| successLight | `#ccfbf1` | Income background |
| error / expense | `#fb7185` | Expense, negative, danger |
| errorLight | `#ffe4e6` | Expense background |
| warning | `#22b8cf` | Warning |
| warningLight | `#cffafe` | Warning background |
| info | `#0891b2` | Info / AI |
| border | `#a5f3fc` | Borders |
| borderLight | `#cffafe` | Subtle dividers |
| aiBg | `#def7fb` | AI surfaces |
| overlay | `rgba(8,51,68,0.45)` | Modal overlay |
| ripple | `rgba(14,116,144,0.2)` | Press ripple |

## Colors — Dark theme

| Token | Hex |
|-------|-----|
| primary | `#22b8cf` |
| bg | `#0d2d38` |
| surface | `#142e3a` |
| textPrimary | `#ecfeff` |

## Tier colors

| Tier | Hex |
|------|-----|
| T0 Offline | `#5f8a96` |
| T1 Social Commerce | `#22b8cf` |
| T2 Commerce | `#0891b2` |
| T3 CRM & Growth | `#0e7490` |
| T4 Business Intelligence | `#155e75` |

## Gradients

| Token | Stops | Direction |
|-------|-------|-----------|
| hero | `#0e7490` → `#0891b2` → `#22d3ee` (0, 0.55, 1) | diagonal |
| button | `#0e7490` → `#0891b2` | horizontal |
| soft | `#ecfeff` → `#f0fdfa` | vertical |
| softDark | `#0d2d38` → `#0a2430` | vertical (dark) |

## Typography

- **Bengali (primary):** Noto Sans Bengali — weights 400/500/600/700/800. *(Reference used TiroBangla 400 only.)*
- **Latin (secondary):** Be Vietnam Pro (fallback Inter, system).
- **Sizes (px):** xs 11 · sm 13 · base 15 · md 16 · lg 18 · xl 20 · 2xl 24 · 3xl 28 · 4xl 34
- **Weights:** regular 400 · medium 500 · semibold 600 · bold 700
- **Line heights:** tight 1.15 · normal 1.4 · relaxed 1.6

## Spacing (4px base)

xs 4 · sm 8 · md 12 · base 14 · lg 18 · xl 22 · 2xl 28 · 3xl 36 · 4xl 44

## Radius

sm 12 · md 16 · lg 20 · xl 20 · 2xl 24 · btn 16 · full 9999

## Shadows / elevation

| Token | Spec |
|-------|------|
| sm | offset 0/2, blur 8, teal `#0e7490` @ 8%, elevation 2 |
| card | offset 0/4, blur 14, navy `#083344` @ 12%, elevation 3 |
| soft | offset 0/8, blur 18, navy `#083344` @ 18%, elevation 6 |
| md | offset 0/4, blur 12, teal `#0e7490` @ 10%, elevation 4 |
| lg | modal-level (largest blur/offset) |

## Motion

- duration 340ms · rippleIn 180ms · rippleOut 260ms · pulse 1400ms · stagger 50ms
- spring: stiffness 280, damping 18, mass 0.8

## Breakpoints (NEW — not in the reference)

The reference defined **no breakpoints** (mobile UI stretched to the viewport). We add:

| Token | Min width | Shell |
|-------|-----------|-------|
| sm | 0 | phone — bottom-tabs + stack |
| md | 640 | large phone / small tablet |
| lg | 900 | tablet/desktop — **switch to sidebar + top bar** |
| xl | 1280 | wide desktop — max-width ~1200px content, multi-column grids |
