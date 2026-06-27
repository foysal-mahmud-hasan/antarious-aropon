# CLAUDE.md — Aropon

> Read this first. Then read `.claude/README.md` for the full documentation map.
> This file states the **golden rules**. The detailed specs live under `.claude/`.

## What Aropon is

Aropon is a **mobile-first SaaS "business companion" for Bangladeshi MSMEs** — **one Expo app**
that hosts **all five subscription tiers** (entitlement-gated). It is built with Expo + Expo Router
+ React Native Web, runs **native on iOS/Android and fully in the browser**, and is **Bengali-first**.

Currency is **BDT (৳)**. Users are mobile-heavy, often on **low-end Android** with intermittent
connectivity. Social commerce (selling via Facebook/Instagram) is central.

**Build order:** Tier 0 + Tier 1 first. T2–T4 land later in the same codebase and backend — but
the entitlement system is designed for all five tiers from day one.

| Tier | Name | Price (BDT/mo) | Headline |
|------|------|----------------|----------|
| T0 | Offline Mode | 200 | Basic bookkeeping + Brand Studio (AI logo/caption/copy). **Fully offline.** |
| T1 | Social Commerce | 700–800 | FB/IG inbox, auto-replies, order confirmation, finance tracking, calendar, AI insights |
| T2 | Commerce | 1500–1700 | Website integration, inventory, courier *(later)* |
| T3 | CRM & Growth | 3000–3500 | Lead capture, customer DB, scoring, AI upsell/cross-sell *(later)* |
| T4 | Business Intelligence | 5000–7000 | Dashboards, summaries, analytics, AI lead-closing *(later)* |

## Golden rules (non-negotiable)

1. **Offline-first for T0.** Tier 0 is literally "Offline Mode." The app must be fully usable with
   no connectivity and reconcile on reconnect. Local SQLite (expo-sqlite + Drizzle) is the source of
   truth on-device; **PowerSync** syncs to Supabase Postgres. Money is stored as **integer poisha**
   and ledgers are **append-only/event-sourced** so offline merges are lossless.
2. **Tier-gating is server-enforced.** Entitlements map tier → features, are enforced in the API
   (tRPC guard) and DB (**RLS**), and mirrored on the client via **`<TierGate>`**. Never gate a
   feature on the client alone. Entitlements are **decoupled from billing**.
3. **Multi-tenant always.** Every row is scoped by `org_id` via Postgres **RLS**. One user may
   own/belong to multiple businesses. Roles: **owner / manager / staff**.
4. **Bengali-first.** Default UI is Bengali (English toggle). Use Bengali numerals (০-৯) and ৳
   formatting via the shared i18n/format utils. All user-facing strings go through `packages/i18n`.
5. **Responsive web parity — never ship stretched mobile UI.** Tamagui responsive props compile to
   real CSS media queries. Phone = bottom-tabs + stack; tablet/desktop = sidebar + top bar +
   max-width content. A stretched phone layout on desktop is a **bug**.
6. **Type-safe, single source of truth.** TypeScript everywhere. Zod schemas in
   `packages/validators` are shared client↔server. Drizzle schema in `packages/db` is shared by
   server Postgres and client SQLite.
7. **No mock-data shortcuts.** Build against real persistence (local SQLite + Supabase) from the
   start. The reference apps were mock-only; we are not.
8. **No hardcoded hex / magic numbers in UI.** Use design tokens from `packages/ui`
   (`.claude/design/design-system.md`). Minimum 48px tap targets, WCAG AA contrast.
9. **Modular & SOLID.** Domain logic lives in `packages/core`, separate from UI and transport.
   Respect package import boundaries (`.claude/architecture/folder-structure.md`).
10. **Secrets never reach the client.** AI keys, service-role keys, payment secrets live server-side
    only (`services/api`, behind `packages/core/ai` provider interface).

## Stack at a glance

- **Client:** Expo + Expo Router + React Native Web + **Tamagui** (design system in `packages/ui`).
- **State:** TanStack Query (server) + Zustand (client) + Context (theme/auth/i18n).
- **Forms/validation:** React Hook Form + **Zod** (`packages/validators`).
- **Offline:** expo-sqlite + **Drizzle** + **PowerSync** ↔ Supabase Postgres.
- **Backend:** **Supabase** (Postgres + Auth phone-OTP + Storage + Realtime + RLS) + thin
  **Hono + tRPC** API (`services/api`). **ORM:** Drizzle (`packages/db`).
- **Jobs:** Inngest. **Cache:** Upstash Redis. **AI:** Anthropic Claude (`packages/core/ai`).
- **Payments:** SSLCommerz + bKash/Nagad (BDT recurring).
- **Obs:** Sentry + PostHog + Pino/Better Stack. **Tests:** Vitest, RN Testing Library, Maestro, Playwright.
- **Monorepo:** Turborepo + pnpm. **CI/CD:** GitHub Actions + EAS (Build/Submit/Update OTA).

## Monorepo map

```
apps/mobile        # the Expo product app (all tiers)
apps/marketing     # optional Next.js landing page (not the product)
services/api       # Hono + tRPC server (business logic, integrations, job triggers)
packages/ui        # Tamagui design system + components
packages/core      # domain logic + ai provider interface
packages/api       # tRPC client + shared types
packages/db        # Drizzle schema (server Postgres + client SQLite)
packages/validators# Zod schemas (shared client↔server)
packages/i18n      # Bengali-first translations + ৳/numeral formatters
packages/config    # shared tsconfig/eslint/prettier
```

## Working agreement for AI assistants

- **Decide and defend.** Act as a staff engineer: make sound decisions, justify them, and propose
  better approaches than the references where warranted — don't ask the user to choose what you can
  determine from these docs.
- **No feature code without approval.** The repo is currently in the documentation/scaffolding
  phase. Implementation (Phase 7) begins only on explicit approval. See
  `.claude/roadmap.md` and the plan at `~/.claude/plans/aropon-rebuild-eager-hopper.md`.
- When in doubt about a rule, the doc under `.claude/` wins over assumptions. Update the docs when a
  decision changes, and add an ADR for significant choices.
