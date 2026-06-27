# ADR-0001: Expo (React Native + RN Web) over Capacitor/Ionic

- **Status:** Accepted, 2026-06-26
- **Deciders:** Principal architect, mobile lead
- **Tags:** platform, mobile, web-parity, performance

## Context

Aropon is a **mobile-first SaaS for Bangladeshi MSMEs**, delivered as **ONE Expo app** that hosts all five subscription tiers (T0–T4), with T0 (Offline Mode) and T1 (Social Commerce) built first.

Two hard constraints shape the platform choice:

1. **Target hardware is low-end Android.** Our users run budget devices (1–3 GB RAM, modest GPUs) on flaky 3G/4G. Scroll performance, list virtualization, animation smoothness, and keyboard handling on cheap Android phones are make-or-break for retention.
2. **We want one TypeScript codebase end-to-end.** The backend (services/api, packages/db, packages/validators) is TypeScript. Sharing types, Zod schemas, and Drizzle table definitions client↔server is a primary lever for velocity and correctness (see ADR-0004, ADR-0007).

A secondary, *deferred* requirement: T4 (Business Intelligence) implies richer, denser dashboards that are most naturally authored as web surfaces. That work is later (M6) and must not drive the foundational choice.

## Decision

Build the app on **Expo** using:

- **Expo SDK** as the managed RN toolchain (EAS build/update, native modules, OTA).
- **Expo Router** for file-based, typed routing shared across native and web.
- **React Native Web** so the same component tree renders as a real responsive web surface (paired with Tamagui's compiled CSS media queries — see ADR-0005).

This gives us **native UI on mobile** (real platform views, no WebView) and **a genuine web build from the same source**, with full TypeScript sharing into the backend.

## Alternatives Considered

| Option | Why rejected |
|---|---|
| **Capacitor / Ionic** | UI runs inside a **WebView**. On our target low-end Android hardware this means scroll/animation jank, heavier memory pressure, and fiddlier soft-keyboard handling (viewport resize quirks, input focus jumps). Capacitor's real strength — rich, complex **web dashboards** — maps exactly to the **deferred T4** work, not the T0/T1 we build first. Optimizing for the wrong tier on the wrong hardware. |
| **Flutter** | Excellent rendering performance, but **Dart forfeits TypeScript code-sharing** with our backend (no shared Zod/Drizzle/types), duplicating schemas and validation. It also ignores the existing TS/RN reference apps we are building from, discarding prior art and team familiarity. |
| **Bare React Native (no Expo)** | More native control but heavy DevOps cost (manual native upgrades, no EAS, no Expo Router web story out of the box). Premature for our stage; Expo's prebuild escape hatch covers the rare native need. |

## Consequences

**Positive**
- Native-quality UI on low-end Android: real native views, smooth scroll/animation, predictable keyboard behavior.
- One source tree → native iOS/Android **and** responsive web (RN Web + Tamagui).
- Full TypeScript sharing into the backend (types, Zod, Drizzle).
- EAS build/update enables OTA fixes and fast CI/CD (see roadmap M0).

**Negative / trade-offs**
- RN Web is **not** a full web framework; very dense, web-idiomatic dashboards (T4) take extra effort vs. a React DOM stack.
- Some native modules need Expo config plugins / prebuild; occasional version-alignment friction across the Expo SDK.
- We accept a "good web, great mobile" balance rather than "great web" — deliberate, given mobile-first users.

## Revisit when…

**BI/T4 web-dashboard usage dominates** real traffic (e.g., analysts living in dense desktop dashboards). Because the **core/domain and API are decoupled** (packages/core + thin API, ADR-0002/0007), we can add a **dedicated web surface** (e.g., a React DOM dashboard app consuming the same tRPC API) **without backend changes** — additive, not a rewrite.
