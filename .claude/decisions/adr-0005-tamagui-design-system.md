# ADR-0005: Tamagui as the cross-platform design system

- **Status:** Accepted, 2026-06-26
- **Deciders:** Principal architect, design-systems lead
- **Tags:** ui, styling, responsive, web-parity, performance

## Context

Aropon is one Expo app rendering to **native Android/iOS and responsive web** (RN Web, ADR-0001). A core M0 acceptance bar: **a stretched phone UI on desktop is a failure.** The app must present an **adaptive shell** — bottom-tabs on phone, sidebar on wide viewports — which requires **real responsive breakpoints**, not just width math at runtime.

The references **lacked true responsive web parity**: built with mobile primitives, they rendered as a stretched mobile column on desktop. We must do better from M0.

Performance also matters on low-end Android: runtime style computation on every render is a tax we want to avoid.

## Decision

Adopt **Tamagui** as the styling + component foundation in **packages/ui**:

- **Compiler-optimized styling**: Tamagui's compiler **flattens and extracts styles at build time**, reducing runtime work on low-end devices.
- **Responsive props compile to REAL CSS media queries on web** (and to efficient runtime media handling on native). This is the key enabler: the **adaptive shell (tabs ↔ sidebar)** and all responsive layouts are expressed declaratively and become genuine media queries on web — delivering true web parity, not a stretched phone.
- **Design tokens** (teal brand palette, spacing, radius, typography) defined once in the Tamagui config and consumed everywhere. **No hardcoded hex** in feature code — only token references.

## Alternatives Considered

| Option | Why rejected |
|---|---|
| **Plain React Native `StyleSheet`** | **No media queries.** Responsiveness degrades to runtime `Dimensions`/width branching, which on web produces a **stretched mobile UI** rather than true breakpoint layouts — exactly the M0 failure mode. No compile-time optimization either. |
| **react-native-unistyles** | Lighter and capable, with good theming and breakpoints, but **less complete** as a full component/design-system layer (fewer primitives, smaller ecosystem) than Tamagui at our needed surface area. **Kept as the documented fallback** if Tamagui's compiler/build complexity becomes a liability. |
| **NativeWind (Tailwind for RN)** | Familiar utility DX, but weaker compile-time extraction story for our targets and a class-string model that fits our token-first, typed-props approach less cleanly. |

## Consequences

**Positive**
- **True responsive web parity from M0**: adaptive tabs↔sidebar shell via real CSS media queries.
- **Better low-end performance**: compiled/flattened styles reduce runtime cost.
- **Token-driven theming** (teal palette) enforces consistency and bans hardcoded hex; theming/dark-mode is centralized.
- Rich cross-platform primitive set accelerates packages/ui.

**Negative / trade-offs**
- **Build complexity**: the Tamagui compiler adds setup and can complicate the Metro/bundler/EAS pipeline; upgrades need care.
- **Learning curve**: token system, `styled`, and media/variant props are a paradigm to learn.
- Some bleeding-edge churn; occasional version pinning needed.

## Revisit when…

The Tamagui compiler/build pipeline becomes a recurring source of breakage or slows EAS builds materially, **or** its primitive coverage falls short for T4 BI dashboards — at which point **react-native-unistyles** (already vetted as fallback) or a targeted DOM styling layer for a dedicated web surface is reconsidered.
