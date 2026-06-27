# Phase 2 — Comparison of the Reference Applications

Reverse-engineering of the two existing Aropon products, to inform (not clone) the rebuild.

- **Design reference:** https://aropon.antarious.com/ — studied for design language only.
- **Feature reference:** https://aropon.vercel.app/choose-tier — studied for features/workflows.
- **Repos (both public):** `github.com/mdKamrul-h/aropon` · `github.com/Antariousai/msme-app`

> **Headline finding:** both apps are **Expo / React-Native-Web prototypes with mock data only** —
> no backend, auth, persistence, tests, payments, real offline mode, or web responsiveness. They are
> excellent *design and feature references* but not a production baseline. The rebuild keeps the
> design language and feature intent, and replaces the implementation.

## Side-by-side

| Dimension | `aropon` (mdKamrul-h) — **primary ref** | `msme-app` (Antariousai) — secondary ref |
|---|---|---|
| Framework | Expo 56, RN 0.85 | Expo 54, RN 0.81 |
| Navigation | **expo-router** (modern, file-based) | React Navigation (older, verbose) |
| State | One large `AppContext` | `TransactionsContext` only |
| Persistence | Mock data in context | Mock + AsyncStorage |
| Design system | Documented ("Dignity-first"), strong token set | None documented |
| Localization | Bengali-first (Noto Sans Bengali / Be Vietnam Pro) | Generic; TiroBangla mentioned |
| Code organization | Feature folders + `components/ui` | Tier folders (`tier0`–`tier4`) |
| Tiers shown | T0–T2 active, T3/T4 "coming soon" | T0–T4 folders, demo PINs |
| Commit hygiene | Clean, focused | Typo-heavy, vague |
| Backend / API | None | None |

## Feature differences

- **`aropon`** is broader and more polished: bookkeeping, orders, inventory, multi-channel messages,
  comments, courier, calendar, insights, credit-score, loan/NGO modules, courses. Tier-conditional
  navigation via `isT1()`/`isT2()` helpers.
- **`msme-app`** is narrower: accounting, purchase orders, tutorial/onboarding, tier-gated screens
  with demo accounts. Useful mainly for its explicit tier-folder organization.
- Neither implements the **new** five-tier commercial structure from the product brief (T0 200 BDT …
  T4 5000–7000 BDT). The rebuild follows the **brief**, not the legacy tier layouts.

## UI / UX differences

- Both share the **teal/cyan, rounded-card, Bengali-first** aesthetic (see
  [`design-tokens.md`](design-tokens.md)). `aropon`'s execution is cleaner and tokenized.
- **Biggest shared UX gap — web is just stretched mobile.** No breakpoints; the phone layout scales
  to the browser width. There is no desktop layout (no sidebar, no max-width content, no multi-column).
- Weak/absent: form validation feedback, error/empty/loading states, offline indicators, dark-mode
  surfacing, accessibility specifics beyond tap-target sizing.

## Architecture observations

- **No separation of concerns from data:** mock data is coupled directly into components/context.
- **`aropon`'s single mega-`AppContext`** will not scale — re-renders, merge conflicts, no caching
  strategy. (We replace it with TanStack Query + Zustand + scoped contexts.)
- **No multi-tenancy, roles, or real auth.** Single-user assumption throughout.
- **No offline engine** despite T0 being "Offline Mode."
- **No tests, logging, analytics, CI/CD, or payments.**

## Better implementations adopted in the rebuild

| Reference weakness | Rebuild improvement | Where documented |
|---|---|---|
| Mock data, no backend | Supabase + thin Hono/tRPC API, real persistence | [arch/system-architecture](../architecture/system-architecture.md), [ADR-0002](../decisions/adr-0002-supabase-plus-thin-api.md) |
| No offline despite "Offline Mode" | SQLite + Drizzle + PowerSync, append-only ledger, integer poisha | [arch/offline-sync](../architecture/offline-sync.md), [ADR-0003](../decisions/adr-0003-offline-first-sqlite-powersync.md) |
| Stretched mobile UI on web | Tamagui media queries + adaptive shell (tabs↔sidebar) from M0 | [design/ui-guidelines](../design/ui-guidelines.md), [ADR-0005](../decisions/adr-0005-tamagui-design-system.md) |
| Single mega-context | TanStack Query + Zustand + scoped contexts | [arch/state-management](../architecture/state-management.md) |
| Single-user, no roles | Multi-tenant orgs + RBAC + RLS | [arch/authorization](../architecture/authorization.md) |
| Ad-hoc tier checks | Central entitlements engine + `<TierGate>`, server-enforced | [arch/subscription-system](../architecture/subscription-system.md), [ADR-0006](../decisions/adr-0006-entitlements-and-tier-gating.md) |
| Single-weight Bengali font | Noto Sans Bengali 400–800 (real weights) | [design/design-system](../design/design-system.md) |
| No tests / CI / observability | Vitest/RNTL/Maestro/Playwright + GitHub Actions + Sentry/PostHog | [eng/testing-strategy](../engineering/testing-strategy.md), [eng/deployment](../engineering/deployment.md) |

## Recommendations

1. **Primary reference = `aropon`** for design language, component inventory, and feature intent.
   **Secondary = `msme-app`** only for the tier-organization idea.
2. **Repos are not needed privately** — both are public and analyzed; the live apps + extracted tokens
   suffice. Optional high-value reuse: lift `aropon`'s design tokens + a few primitives to seed
   `packages/ui` (no fork, no wholesale copy).
3. **Follow the brief's five-tier structure**, not the legacy tiers in either app.
4. **Treat the two biggest gaps — real offline (T0) and true responsive web — as first-class M0/M1
   requirements**, not afterthoughts.
