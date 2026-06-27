# Aropon UI Guidelines

How to **lay out, compose, and localize** Aropon screens across phone, tablet, and desktop
web. Tokens come from `design-system.md`; component contracts from `component-rules.md`.
This file is about **layout, responsiveness, Bengali-first behavior, accessibility, and
state patterns**.

---

## 1. The responsive mandate (what we are fixing)

The reference apps **stretched the phone UI to the browser viewport with no breakpoints** —
1000px-wide single-column lists, tap-only interactions, no hover, no sidebar. **Aropon fixes
this from milestone M0.**

Rules:

1. **Real breakpoints, real CSS.** Use Tamagui media tokens (`$sm`–`$xl`) which compile to
   genuine `@media (min-width: …)` on web. No `Dimensions.get('window')` branching for layout.
2. **Adaptive shell, not stretched phone.** Phone = bottom tabs + stack. Tablet/desktop =
   persistent sidebar + top bar + centered max-width content.
3. **Lists reflow to grids** on wide screens — never a lone column in a 1280px window.
4. **Web affordances are first-class:** hover, focus rings, keyboard nav, real anchors,
   document titles. RN omits these by default; we add them.
5. **48px min tap target. WCAG AA contrast. Always.**

### 1.1 Breakpoints

| Token | min-width | Device band | Shell |
| --- | --- | --- | --- |
| `sm` | 0px | Phone | Bottom tabs + stack |
| `md` | 640px | Large phone / portrait tablet | Bottom tabs + stack (denser) |
| `lg` | 900px | Tablet landscape / small desktop | **Sidebar + top bar** |
| `xl` | 1280px | Desktop wide | Sidebar + top bar, wider grids |

The shell switch happens at **`lg` (900px)**: below = tabs, at/above = sidebar.

```tsx
<YStack $gtMd={{ flexDirection: 'row' }} gap="$lg">
  <Card flex={1} />
  <Card flex={1} $sm={{ display: 'none' }} $gtLg={{ display: 'flex' }} />
</YStack>
```

---

## 2. Adaptive app shell

### 2.1 Phone (`sm` / `md`) — bottom tabs + stack

```
┌─────────────────────────────┐
│  ◈ Aropon            🔔  ☰   │  ← AppHeader (gradientHero or surface)
├─────────────────────────────┤
│                             │
│   [ screen content ]        │  ← single column
│   • full-bleed cards        │     padding $lg
│   • vertical list           │
│                             │
│                             │
│                        ( + )│  ← FAB (radius full, shadow soft)
├─────────────────────────────┤
│  🏠     📊     ➕     💬   👤 │  ← bottom tab bar, 5 max
│  হোম   রিপোর্ট  যোগ   চ্যাট  আমি│     48px targets, active = primary
└─────────────────────────────┘
```

- Navigation: bottom-tab navigator wrapping per-tab stacks.
- Bottom bar: ≤ 5 destinations, icon + Bangla label, active tint `primary`.
- Primary create action = center tab or FAB (not both).
- Header may use `gradientHero` on top-level screens, plain `surface` on detail screens.

### 2.2 Desktop / tablet (`lg` / `xl`) — sidebar + top bar

```
┌──────────────┬──────────────────────────────────────────────┐
│  ◈ Aropon    │  পেজ শিরোনাম            🔍  🔔   ব্যবসার নাম ▾ │ ← top bar (sticky)
│              ├──────────────────────────────────────────────┤
│ 🏠 হোম   ●   │   ┌─ max-width 1200px, centered ───────────┐ │
│ 📊 রিপোর্ট    │   │  ┌────────┐ ┌────────┐ ┌────────┐       │ │
│ 🧾 লেনদেন    │   │  │ Metric │ │ Metric │ │ Metric │       │ │ ← multi-col grid
│ 💬 চ্যাট      │   │  └────────┘ └────────┘ └────────┘       │ │
│ 👥 গ্রাহক     │   │  ┌──────────────┐ ┌──────────────┐      │ │
│ ⚙ সেটিংস     │   │  │  list/grid   │ │  side panel  │      │ │
│              │   │  └──────────────┘ └──────────────┘      │ │
│ ──────────   │   └─────────────────────────────────────────┘ │
│ 👤 প্রোফাইল   │                                                │
└──────────────┴──────────────────────────────────────────────┘
   ~240px                         flex, content max 1200px
```

- **Persistent left sidebar** (~240px): logo, primary nav, active indicator (left bar +
  `chipBg` fill), profile pinned to bottom. Collapsible to ~72px icon rail at `lg`.
- **Top bar** (sticky, `surface` + shadow `sm`): page title, search, notifications, business
  switcher. Replaces the mobile header.
- **Centered content, `maxWidth: 1200`**, auto margins. Content never spans full 1920px.
- The **same screen components** render in both shells — only the shell chrome differs. Build
  one `<AppShell>` that swaps tabs↔sidebar on the `lg` media query.

### 2.3 Content width & grids

| Breakpoint | Content max-width | List columns | Gutter |
| --- | --- | --- | --- |
| `sm` | 100% | 1 | `$lg` (18) |
| `md` | 100% | 1–2 | `$lg` |
| `lg` | 1200px | 2–3 | `$xl` (22) |
| `xl` | 1200px | 3–4 | `$xl` |

Use a `<Grid>` primitive (CSS grid on web via Tamagui, flex-wrap on native) keyed to
breakpoints:

```tsx
<Grid columns={{ sm: 1, md: 2, lg: 3, xl: 4 }} gap="$xl">
  {items.map(i => <MetricCard key={i.id} {...i} />)}
</Grid>
```

---

## 3. Web-only behaviors (RN omits these)

| Behavior | Requirement |
| --- | --- |
| **Hover** | Interactive surfaces get `hoverStyle` (bg shift to `chipBg`, slight elevation). Cursor `pointer`. Native ignores it; web honors it. |
| **Focus ring** | Keyboard focus shows a visible ring: 2px `accent2` outline + 2px offset. Never remove outline without a replacement. |
| **Keyboard nav** | Tab order follows DOM order; arrow keys within menus/lists; `Enter`/`Space` activate; `Esc` closes overlays. All interactive elements reachable without a mouse. |
| **Real anchors** | Navigation links render as `<a href>` on web (Solito/Expo Router) — right-click, open-in-new-tab, and crawlers work. Not `onPress`-only `<Pressable>`. |
| **Document title & meta** | Each route sets `<title>` (e.g. `রিপোর্ট · Aropon`) and description. Use Expo Router `Head` / `react-native-web` head management. |
| **Scroll restoration** | Preserve scroll on back nav (web). |
| **Selection** | Allow text selection on content (`userSelect: text`); disable on buttons/labels. |

```tsx
<Button
  hoverStyle={{ backgroundColor: '$chipBg' }}
  focusStyle={{ outlineColor: '$accent2', outlineWidth: 2, outlineStyle: 'solid', outlineOffset: 2 }}
  pressStyle={{ scale: 0.97 }}
  cursor="pointer"
/>
```

---

## 4. Bengali-first localization

Aropon's primary language is **Bangla**. Design and copy in Bangla first; Latin is the
exception.

### 4.1 Numerals — ০ ১ ২ ৩ ৪ ৫ ৬ ৭ ৮ ৯

- **Display all user-facing numbers in Bengali numerals** by default (amounts, counts, dates,
  phone numbers in body copy). Convert `0-9` → `০-৯` via a `toBn(n)` util at the render layer.
- Keep **input fields and internal data Latin/ASCII**; convert only on display. Accept both
  Bangla and Latin digits on input.

```ts
const BN = ['০','১','২','৩','৪','৫','৬','৭','৮','৯']
export const toBn = (s: string | number) => String(s).replace(/[0-9]/g, d => BN[+d])
```

### 4.2 Currency — ৳ (Bangladeshi Taka)

- Symbol `৳` **prefixes** the amount, no space before digits: `৳১,২৫০`.
- Grouping uses the **South Asian (lakh/crore) system**: `১,২৫,০০০` (1,25,000) not
  `১২৫,০০০`. Group rightmost 3 digits, then every 2.
- Two decimals only when paisa matter; otherwise integer Taka.
- Income amounts in `income` color, expenses in `expense`, prefixed with sign where useful
  (`+৳৫০০` / `−৳২০০` using the real minus `−`, not hyphen).

```ts
formatTaka(125000)  // "৳১,২৫,০০০"
formatTaka(1250.5)  // "৳১,২৫০.৫০"
```

### 4.3 Bengali typography rules

- **Line-height ≥ `normal` (1.4)** for all Bangla text; **`relaxed` (1.6)** for paragraphs.
  Bangla matra/conjuncts clip at `tight` (1.15) — `tight` is for Latin display numerals only.
- Use **Noto Sans Bengali weight range 400–800** for real hierarchy: body 400, labels 500,
  headings 600–700, hero 800. (This is the upgrade over single-weight TiroBangla.)
- Don't letter-space Bangla (breaks conjuncts). Don't ALL-CAPS Bangla (no case).
- Avoid forced truncation mid-conjunct; prefer wrapping or `…` at word boundaries.

### 4.4 RTL

Bangla is **LTR** — no RTL mirroring needed. Do not enable `I18nManager.forceRTL`. (Noted
explicitly so no one "adds RTL support" by reflex.)

---

## 5. Spacing & density per breakpoint

| Context | Phone (`sm`) | Tablet (`lg`) | Desktop (`xl`) |
| --- | --- | --- | --- |
| Screen edge padding | `$lg` (18) | `$xl` (22) | `$xl` (22) |
| Card inner padding | `$base`–`$lg` | `$lg` | `$lg` |
| Section gap | `$xl` (22) | `$2xl` (28) | `$3xl` (36) |
| List row height | ≥ 56 | ≥ 52 | ≥ 48 |
| Tap target | ≥ 48 | ≥ 44 | ≥ 36 (mouse) but keep 44 for touch tablets |

Desktop is **denser** (more per row, smaller gaps relative to content) because pointer
precision is higher; phone stays generous for thumbs.

---

## 6. Accessibility (WCAG AA)

- **Contrast:** body text vs background ≥ 4.5:1; large text (≥ `xl`/bold `lg`) ≥ 3:1; UI
  components/borders ≥ 3:1. `textPrimary #083344` on `surface #fff` ≈ 13:1 ✓. **Do not** put
  `textSecondary #5f8a96` on `bg #ecfeff` for small text (fails AA ~2.9:1) — use it on white
  at ≥ `base`, or darken. Verify every new pairing.
- **Tap targets ≥ 48×48** on touch; spacing between targets ≥ 8.
- **Never color-only:** income/expense also carry sign + icon/label, not just green/red.
- **Labels:** every input has a visible label + `accessibilityLabel`. Icons-only buttons get
  `accessibilityLabel` (in Bangla).
- **Focus visible** on web (section 3). Logical focus order. Trap focus in modals; return
  focus on close.
- **Screen readers:** set `accessibilityRole` (`button`, `header`, `link`, `image`…), live
  regions for async results, `accessibilityState` for selected/disabled.
- **Dynamic type:** respect OS font scaling; layouts must reflow, not clip.
- **Reduced motion:** honor `prefers-reduced-motion` → disable spring/stagger, keep opacity.

---

## 7. Motion usage

| Pattern | Token | Note |
| --- | --- | --- |
| Screen / sheet transition | `base` 340ms | Slide+fade on stack; sheet from bottom (phone) / center modal (desktop) |
| Press feedback | `spring` (280/18/0.8) | `scale: 0.97` + ripple |
| Ripple | `rippleIn` 180 / `rippleOut` 260 | `ripple` color |
| List entrance | `stagger` 50ms | Cap at ~6 items |
| Skeleton / live dot | `pulse` 1400ms loop | Opacity 0.4↔1 |

Motion confirms or relates; never blocks input. Disable under reduced-motion.

---

## 8. State patterns: empty / loading / error

Every data surface defines **all four** states: loading, empty, error, loaded. Never show a
blank screen.

### 8.1 Loading — skeletons, not spinners

Prefer shaped **skeletons** (pulsing `chipBg` blocks at the real layout) over centered
spinners; use a spinner only for ≤1s indeterminate actions (button busy).

```
┌─────────────────────────────┐
│ ▆▆▆▆▆▆▆▆▆      ▆▆▆▆          │  ← pulse 1400ms
│ ▆▆▆▆▆▆▆▆▆▆▆▆▆▆▆▆▆▆▆▆          │
│ ▆▆▆▆▆▆            ▆▆▆▆▆▆      │
└─────────────────────────────┘
```

### 8.2 Empty — friendly + actionable

```
        ◯  (illustration / icon, primary tint)

     এখনো কোনো লেনদেন নেই        ← title, Bangla, semibold lg
  প্রথম লেনদেন যোগ করে শুরু করুন    ← subtitle, textSecondary, base

       [  ➕ লেনদেন যোগ করুন  ]      ← primary CTA
```

Use the `EmptyState` component. Always give a primary action and a one-line reason.

### 8.3 Error — explain + retry

```
        ⚠  (warning tint)
     কিছু একটা সমস্যা হয়েছে
  ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন
            [ আবার চেষ্টা ]
```

Human, Bangla, no stack traces. Offer **retry**; preserve user input. Inline field errors use
`error` color + `errorLight` bg + message below the field.

### 8.4 Offline / sync

MSME users have flaky connectivity. Show a persistent slim banner (`warningLight`) when
offline; queue writes and reconcile. Indicate "অপেক্ষমাণ" (pending sync) on optimistic rows.

---

## 9. Layout do / don't

| Do | Don't |
| --- | --- |
| Switch to sidebar at `lg` | Stretch phone column to 1280px |
| Reflow lists to grids on wide screens | Keep 1 column on desktop |
| Cap content at 1200px, center it | Full-bleed text lines across 1920px |
| Bengali numerals + ৳ on display | Show `1,25,000` Latin in body copy |
| `hoverStyle` + focus ring on web | Tap-only interactions on desktop |
| 48px tap targets | 32px buttons on touch |
| Real `<a href>` links | `onPress`-only navigation everywhere |
