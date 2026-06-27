# Aropon Component Rules

Contracts for the `packages/ui` primitive library. Tokens come from `design-system.md`;
layout/responsive behavior from `ui-guidelines.md`. This file defines **how components are
shaped, named, themed, and made accessible & responsive.**

---

## 1. Core principles

1. **Composition over configuration.** Small primitives that nest beat one mega-component
   with 40 props. Prefer `<Card><Row>…</Row></Card>` over `<Card title… subtitle… trailing…/>`.
2. **Theme via tokens — zero hardcoded literals.** No raw hex/px/ms inside a component. Use
   `$color.*`, `$space.*`, `$radius.*`, animation/shadow tokens. A lint rule should reject
   `#` and bare numbers in style props.
3. **Variants, not booleans-soup.** One `variant` / `size` prop with named values beats
   `isPrimary`, `isLarge`, `isDanger`. Variants map to token sets in the styled config.
4. **Responsive by default.** Every layout primitive accepts media props (`$gtLg`, …) and
   sensible cross-platform defaults. Components don't assume phone width.
5. **Accessible by default.** Role, label, state, focus, and 48px targets are built in, not
   opt-in.
6. **Controlled or uncontrolled — support both.** Stateful inputs follow the React pattern in
   §3.

---

## 2. API conventions

### 2.1 Prop naming

| Concern | Convention | Example |
| --- | --- | --- |
| Visual style set | `variant` | `variant="primary"` |
| Size scale | `size` | `size="md"` |
| Boolean state | `is`-less adjective | `disabled`, `loading`, `selected`, `full` |
| Controlled value | `value` + `onChange` | `value`, `onChangeText` |
| Uncontrolled seed | `defaultValue` | `defaultValue` |
| Event handlers | `on` + Verb | `onPress`, `onChangeText`, `onOpenChange` |
| Slots | named React nodes | `icon`, `iconAfter`, `header`, `footer` |
| Layout passthrough | Tamagui style props | `padding`, `gap`, `$gtLg` |

- Every primitive **forwards refs** and **spreads `...rest`** to its root so consumers can
  add style props, test IDs, and a11y props.
- Children-first: render via `children`; use slot props only for fixed structural positions.
- Names are English in code; **all default user-visible strings are Bangla** (passed in or via
  i18n keys), never hardcoded English.

### 2.2 Variant config pattern (Tamagui `styled`)

```tsx
export const Button = styled(Stack, {
  name: 'Button',
  role: 'button',
  borderRadius: '$btn',
  alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: '$sm',
  cursor: 'pointer',
  pressStyle: { scale: 0.97 },
  hoverStyle: { opacity: 0.95 },
  focusStyle: { outlineColor: '$accent2', outlineWidth: 2, outlineStyle: 'solid', outlineOffset: 2 },

  variants: {
    variant: {
      primary:   { backgroundColor: '$primary',   color: '$textInverse' }, // + gradientButton fill via wrapper
      secondary: { backgroundColor: '$secondary',  color: '$textInverse' },
      outline:   { backgroundColor: 'transparent', borderWidth: 1, borderColor: '$primary', color: '$primary' },
      ghost:     { backgroundColor: 'transparent', color: '$primary' },
      danger:    { backgroundColor: '$error',      color: '$textInverse' },
      income:    { backgroundColor: '$success',    color: '$textInverse' },
      expense:   { backgroundColor: '$error',      color: '$textInverse' },
    },
    size: {
      sm: { height: 36, paddingHorizontal: '$md', /* desktop-only compact */ },
      md: { height: 48, paddingHorizontal: '$lg' }, // default, meets 48px tap target
      lg: { height: 54, paddingHorizontal: '$xl' },
      xl: { height: 60, paddingHorizontal: '$2xl' },
    },
    full:     { true: { alignSelf: 'stretch', flex: 1 } },
    disabled: { true: { opacity: 0.5, pointerEvents: 'none' } },
  } as const,

  defaultVariants: { variant: 'primary', size: 'md' },
})
```

> `size="sm"` (36px) is **desktop/mouse only** — do not use it as a touch target on phone.
> On touch, minimum is `md` (48px).

---

## 3. Controlled vs uncontrolled

All stateful inputs (`Input`, `Chip` as toggle, switches, selects) support both modes:

| Mode | Props | Source of truth |
| --- | --- | --- |
| Controlled | `value` + `onChangeText` (or `onChange`) | Parent |
| Uncontrolled | `defaultValue` (+ optional `onChangeText`) | Internal `useState` |

Rule: if `value !== undefined`, the component is controlled and never sets internal state.
Use a `useControllableState` helper. Never silently swap modes mid-life.

---

## 4. Core primitives to build

### 4.1 Layout: `Stack`, `Row`, `Grid`

- `Stack` = vertical (`YStack`) flex container; `Row` = horizontal (`XStack`). Both accept
  `gap`, padding, and media props.
- `Grid` — responsive columns (`columns={{ sm:1, lg:3 }}`); CSS grid on web, flex-wrap native.
- These are the building blocks; higher components compose them. No layout magic numbers —
  use `$space`.

### 4.2 `Text` / `T`

- `T` is the shorthand text primitive. Props: `size` (`xs`…`4xl`), `weight`
  (`regular`/`medium`/`semibold`/`bold`), `color` (token), `tone`
  (`primary`/`secondary`/`tertiary`/`inverse`/`income`/`expense`), `numberOfLines`.
- **Defaults to Bengali font** and `lineHeight: normal` (1.4) — never `tight` for Bangla.
- A `tabular` prop for aligned numerals in tables/amounts.
- `T.Amount` helper renders Taka via `formatTaka` + tone coloring.

```tsx
<T size="lg" weight="bold">আজকের আয়</T>
<T.Amount value={12500} kind="income" />   // ৳১২,৫০০ in income color
```

### 4.3 `Button`

- Variants: `primary` | `secondary` | `outline` | `ghost` | `danger` | `income` | `expense`.
- Sizes: `sm` | `md` | `lg` | `xl` (see §2.2; `md`=48px default).
- Props: `icon`, `iconAfter`, `loading` (shows spinner, keeps width, disables), `disabled`,
  `full`, `onPress`. `primary` uses `gradientButton` fill + shadow `md`.
- A11y: `role="button"`, `accessibilityLabel` required when icon-only, `accessibilityState`
  for disabled/busy, focus ring, hover, `pressStyle` scale.

### 4.4 `Card`

- Surface container: `surface` bg, `$radius.md`, shadow `card`, padding `$lg` default.
- Props: `elevation` (`flat`/`sm`/`card`/`soft`), `interactive` (adds hover/press/cursor when
  it's a tappable card), `padded` (bool/token), `onPress`.
- Composition-first: put `Row`/`Stack`/`SectionHeader` inside. No `title`/`subtitle` props.
- `Card.AI` variant uses `aiBg` + `borderLight` for assistant-surfaced content.

### 4.5 `Input`

- Controlled/uncontrolled (§3). `surface` bg, `border` border, `$radius.sm`, min height 48.
- Props: `value`/`defaultValue`, `onChangeText`, `label`, `placeholder`, `helperText`,
  `error` (string → `error` color + `errorLight` bg + message), `icon`, `iconAfter`,
  `keyboardType`, `disabled`.
- Bangla label above field; accepts Bangla **and** Latin digit input, stores Latin.
- A11y: programmatic label association, `accessibilityLabel`, focus ring, error announced via
  live region.

### 4.6 `Chip`

- Compact label/filter. `chipBg` bg, `$radius.sm`, padding `$sm`/`$md`, text `sm`.
- Modes: static label, removable (`onRemove` → ✕), or selectable toggle (`selected` +
  `onPress`; selected → `primary` bg / `textInverse`).
- Min interactive height 36 (desktop) / 44 (touch).

### 4.7 `Badge`

- Tiny status/count marker. Variants: `neutral`/`success`/`error`/`warning`/`info` mapping to
  the `*Light` bg + matching text. `full` radius. Used for counts and inline status.

### 4.8 `StatusPill`

- Pill (`$radius.full`) showing a lifecycle status with dot + label, e.g. পরিশোধিত (paid),
  অপেক্ষমাণ (pending), বাতিল (cancelled). Variant→token color set. Optional pulsing dot
  (`pulse` 1400ms) for live/pending. Color is **never the only signal** — always has a label.

### 4.9 `SectionHeader`

- Row with title (`lg`/`semibold`), optional subtitle (`sm`/`textSecondary`), optional
  trailing action (link/`ghost` button). Spacing `$lg` above. Pure composition of `Row`+`T`.

### 4.10 `AppHeader`

- **Responsive shell chrome.** Phone: top app bar (optional `gradientHero` on top-level
  screens), title + leading (back/menu) + trailing actions, safe-area aware. Desktop: renders
  as the **top bar** beside the sidebar (page title, search, notifications, business switcher).
- Same component, media-driven layout. Sets the document title on web.

### 4.11 `EmptyState`

- Props: `icon`/`illustration`, `title` (Bangla), `description`, `action` (CTA node).
- Centered, generous padding, primary-tinted icon. One primary action. See `ui-guidelines.md`
  §8.2.

### 4.12 `TierGate`

- Wraps tier-restricted content. Props: `requiredTier` (`T0`–`T4`), `currentTier`,
  `children`, `fallback`. If `currentTier < requiredTier`: render a locked overlay/upsell
  card tinted with the `tierN` color + upgrade CTA; else render `children`.
- Accent uses the **required** tier's color (`tier0`…`tier4`). Keep the gate's lock copy in
  Bangla; explain the value, not just "locked."

```tsx
<TierGate requiredTier="T2" currentTier={user.tier} fallback={<UpgradeCard tier="T2" />}>
  <AdvancedReport />
</TierGate>
```

### 4.13 `MetricCard`

- Dashboard KPI card: label (`sm`/`textSecondary`), value (`2xl`/`bold`, `tabular`), optional
  delta (▲/▼ + % in `income`/`expense`), optional sparkline/icon. Built on `Card` + `Stack`.
- Money values via `T.Amount` (Bengali numerals + ৳). In grids, equal height; reflows columns
  per breakpoint (`ui-guidelines.md` §2.3).

---

## 5. Accessibility requirements (per component)

| Requirement | Applies to |
| --- | --- |
| `accessibilityRole` set (`button`/`header`/`link`/`image`/`text`) | All |
| `accessibilityLabel` (Bangla) when no visible text (icon-only) | Button, Chip, IconButton |
| `accessibilityState` (`disabled`/`selected`/`busy`/`checked`) | Button, Chip, Input, toggles |
| Visible focus ring on web | All interactive |
| ≥ 48px touch target | All interactive on touch |
| Label↔control association | Input, selects |
| Error announced via live region | Input |
| Not color-only (icon/label too) | StatusPill, Badge, T.Amount |
| Honors reduced-motion | Anything animated |

---

## 6. Responsive behavior rules

- Components **must not** read `Dimensions` for styling; use Tamagui media props / `useMedia()`.
- Provide sane phone defaults; widen via `$gtMd` / `$gtLg`.
- `Button size="sm"` and `Chip` 36px heights are **pointer-only** — guard touch min-sizes.
- `Card`/`MetricCard` are grid-friendly: no fixed widths, fill their grid cell, equal-height.
- `AppHeader` swaps app-bar↔top-bar at `lg`. `Grid` changes column count at breakpoints.
- Hover styles apply only where a pointer exists (web) — never depend on hover for core info.

```tsx
// good: media props, token-driven, no literals
<Card padding="$base" $gtLg={{ padding: '$lg' }} elevation="card">
  <SectionHeader title="সাম্প্রতিক লেনদেন" action={<Button variant="ghost" size="sm">সব দেখুন</Button>} />
  <Grid columns={{ sm: 1, lg: 2 }} gap="$lg">{/* … */}</Grid>
</Card>
```

---

## 7. Component checklist (definition of done)

- [ ] Built from tokens only — no hex/px/ms literals.
- [ ] `variant` + `size` via Tamagui `variants`, with `defaultVariants`.
- [ ] Controlled **and** uncontrolled supported (if stateful).
- [ ] Forwards ref, spreads `...rest`, accepts style/media props.
- [ ] A11y: role, label, state, focus ring, 48px target, not color-only.
- [ ] Responsive defaults; verified at `sm`, `lg`, `xl`.
- [ ] Web: hover, focus-visible, keyboard operable; links are real anchors.
- [ ] Bangla default strings, Bengali numerals/৳ for numbers, line-height ≥ 1.4.
- [ ] Honors reduced-motion.
- [ ] Light + dark theme correct.
