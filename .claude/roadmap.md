# Aropon — Delivery Roadmap

Mobile-first SaaS for Bangladeshi MSMEs. **ONE Expo app** hosting all five tiers (T0–T4); we **build T0 + T1 first**. This roadmap details the **built scope (M0–M3)** with Goals / Deliverables / Dependencies / Risks / Acceptance Criteria per milestone, plus a brief **Later phases (M4–M6)** section.

> Authoritative decisions live in `.claude/decisions/` (ADR-0001…0007). Project rules: offline-first, tier-gating, Bengali-first, no hardcoded hex, no mock data, shared types/schemas.

## Milestone overview

| Milestone | Theme | Tier | Outcome |
|---|---|---|---|
| **M0** | Foundation & Platform | — | The skeleton: monorepo, design system, adaptive shell, data+sync, auth, multi-tenancy, entitlements, i18n, observability, CI/CD |
| **M1** | Tier 0 — Offline Mode | T0 | Offline-first bookkeeping + Brand Studio (AI logo/caption/copy) |
| **M2** | Tier 1 — Social Commerce | T1 | FB/IG inbox, auto-replies, orders, finance tracking, calendar, AI insights |
| **M3** | Billing & Launch Hardening | T0/T1 | Recurring billing (SSLCommerz/bKash/Nagad), perf, security, store launch |
| **M4–M6** | Later (same app/backend) | T2/T3/T4 | Commerce, CRM & Growth, Business Intelligence |

---

## M0 — Foundation & Platform

**Goals**
- Stand up the end-to-end skeleton every later milestone builds on.
- Prove **responsive parity** (adaptive shell) and the **offline data + sync** path before any feature work.
- Establish multi-tenancy, entitlements, i18n, observability, and CI/CD as load-bearing primitives.

**Deliverables**
- **Turborepo + pnpm** monorepo: `apps/{mobile,marketing}`, `services/api`, `packages/{ui,core,api,db,validators,i18n,config}`. (ADR-0007)
- **Tamagui design system** in `packages/ui` with **teal brand tokens** (color/spacing/radius/typography), theming. (ADR-0005)
- **Expo Router responsive adaptive shell**: **bottom-tabs on phone ↔ sidebar on wide**, via real CSS media queries. (ADR-0001/0005)
- **Data layer**: Supabase Postgres + **Drizzle (server)**; **expo-sqlite + Drizzle (local)**; **PowerSync** bidirectional sync wired end-to-end. (ADR-0002/0003/0004)
- **Phone-OTP auth** (Supabase Auth).
- **Multi-tenant org/membership** model + **RLS** policies enforcing tenant isolation.
- **Entitlements engine** (packages/core) with **all five tiers modeled** + **`<TierGate>`** client mirror + tRPC guard scaffold. (ADR-0006)
- **i18n (Bengali-first)** infra in `packages/i18n` (`bn` default, `en` secondary).
- **Observability**: Sentry (errors) + PostHog (product analytics).
- **CI/CD + EAS**: Turborepo-cached pipelines (lint/typecheck/test/build) + EAS build/update.

**Dependencies**
- None upstream (this is the foundation). Supabase project + PowerSync account provisioned. EAS/Expo accounts and app-store identifiers reserved.

**Risks**
- **Monorepo ↔ Metro/EAS resolution** friction (pnpm symlinks/hoisting). *Mitigation:* lock config early in `packages/config`, smoke-build on CI.
- **Tamagui compiler** complicates the bundler/EAS pipeline. *Mitigation:* unistyles fallback documented (ADR-0005); spike early.
- **PowerSync sync-rules ↔ Drizzle schema drift**. *Mitigation:* single schema source, sync-rule review in PR checklist.
- Responsive shell underestimated → ships as stretched phone UI (**M0 failure**).

**Acceptance Criteria**
- [ ] The adaptive shell renders as **bottom-tabs on phone** and **sidebar on desktop/wide** — a stretched phone UI on desktop **FAILS M0**.
- [ ] A user signs in via **phone-OTP** and lands in an **org** scoped by RLS (cannot see other tenants' data).
- [ ] A row written locally (SQLite/Drizzle) **syncs to Supabase Postgres** and back via PowerSync.
- [ ] `<TierGate>` shows/hides a sample capability per tier; server tRPC guard rejects an unentitled call.
- [ ] UI uses **tokens only** (no hardcoded hex); sample strings render from **`bn`** by default.
- [ ] Sentry captures a thrown error; PostHog records an event; **EAS build** succeeds via CI.

---

## M1 — Tier 0: Offline Mode

**Goals**
- Deliver T0's headline promise: **bookkeeping that fully works offline** and reconciles on reconnect.
- Ship **Brand Studio** AI tools (logo, caption, copywriting) as the second T0 value driver.

**Deliverables**
- **Offline-first bookkeeping**: record **income/expense** entirely offline; categories; running balance; transaction history.
  - Append-only/event-sourced financial records; **money in integer poisha**. (ADR-0003)
  - Local SQLite source of truth; PowerSync reconciliation on reconnect.
- **Brand Studio (AI)**: AI **logo** generation, AI **caption** generation, AI **copywriting** — triggered via the thin API, executed as **Inngest jobs**, results stored (Supabase Storage for assets).
- T0 entitlement wired through the entitlements engine + `<TierGate>`.
- Bengali-first copy for all bookkeeping + Brand Studio UX.

**Dependencies**
- **M0 complete** (data+sync, auth, tenancy, entitlements, shell, i18n).
- AI provider(s) for image/text generation; job runtime (Inngest) operational.
- Supabase Storage configured for generated assets.

**Risks**
- **Sync conflicts corrupting money** if two devices edit offline. *Mitigation:* append-only/event-sourced model, integer poisha, UUID PKs (ADR-0003).
- **AI cost/latency/quality** for logos/captions on low-end connectivity. *Mitigation:* async jobs, caching, graceful pending/failed states; cost caps per tier.
- Local DB **migration/storage growth** on cheap devices.

**Acceptance Criteria**
- [ ] In **airplane mode**, a user records multiple income/expense transactions; balance updates locally; app stays fully usable.
- [ ] On reconnect, those transactions **reconcile to Supabase Postgres** with **no double-count and no loss**; balances match across devices.
- [ ] All money values are **integer poisha**, displayed as ৳ — no float drift.
- [ ] Brand Studio generates a **logo**, a **caption**, and **marketing copy**; assets persist and reappear after relaunch.
- [ ] Bookkeeping + Brand Studio gated to **T0** entitlement; UI is Bengali-first, tokens-only.

---

## M2 — Tier 1: Social Commerce

**Goals**
- Turn Aropon into a social-commerce cockpit: manage **FB/IG** conversations, orders, and finances in one place.
- Add **AI insights** that turn the org's data into actionable suggestions.

**Deliverables**
- **FB/IG integration** via **Meta Graph API** (thin API adapters, ADR-0002): connect pages/accounts, ingest messages/comments (realtime + webhooks).
- **Unified inbox**: messages **and** comments in one stream, per conversation/thread.
- **Automated replies + manual escalation**: rule/AI auto-responses with a clear hand-off to a human agent.
- **Order confirmation** flow (capture/confirm orders arising from chats).
- **Revenue / expense / profit tracking** building on M1 bookkeeping (profit = revenue − expense, poisha).
- **Daily/weekly calendar** view of activity/orders.
- **AI finance insights + performance suggestions** (e.g., "expenses up X%", "best-selling item", posting suggestions) as Inngest jobs.
- T1 entitlement wired through the engine + `<TierGate>`.

**Dependencies**
- **M0 + M1 complete** (finance data model reused for revenue/profit).
- **Meta Graph API** app review/permissions approved; webhook endpoints live.
- AI provider for insights/auto-replies; Inngest jobs operational.

**Risks**
- **Meta API approval/permission** delays and rate limits. *Mitigation:* start app review early; backoff + queueing; degrade gracefully.
- **Auto-reply quality / brand risk** (wrong or off-tone replies). *Mitigation:* confidence thresholds, mandatory escalation path, audit log, Bengali-tuned prompts.
- **Realtime inbox** scale (many threads). *Mitigation:* pagination, realtime + incremental sync.
- Online-dependent features must **degrade cleanly offline** (inbox is inherently online; finance stays offline-first).

**Acceptance Criteria**
- [ ] A connected **FB/IG** page surfaces **messages and comments** in one unified inbox.
- [ ] An **automated reply** fires on a matching rule; a human can **escalate/take over** a thread.
- [ ] A chat converts to a **confirmed order**; the order feeds revenue tracking.
- [ ] **Revenue/expense/profit** are correct (integer poisha) and visible on a **daily/weekly calendar**.
- [ ] **AI insights** produce at least finance summary + one performance suggestion.
- [ ] All T1 features gated to **T1** entitlement; Bengali-first, tokens-only, responsive on phone + desktop.

---

## M3 — Billing & Launch Hardening

**Goals**
- Monetize T0/T1 with **local recurring billing** and harden the app for public launch.

**Deliverables**
- **Recurring billing** for T0/T1 via **SSLCommerz / bKash / Nagad**: subscribe, renew, handle payment webhooks; map payment result → **effective tier** (billing stays **decoupled** from entitlements — ADR-0006).
- Billing states: trial, active, grace period, lapsed → drive the entitlements engine, **not** feature code directly.
- **Performance pass**: cold-start, list virtualization, bundle size, low-end Android profiling, sync efficiency.
- **Security review**: RLS coverage audit, tRPC guard coverage, secrets handling, payment webhook signature verification, PII review.
- **Store submission**: Play Store (and App Store if in scope) assets, policy compliance, EAS submit.

**Dependencies**
- **M0–M2 complete**; T0/T1 feature-complete.
- Merchant accounts/sandbox + production credentials for SSLCommerz/bKash/Nagad.
- Store developer accounts, listings, and policy assets ready.

**Risks**
- **BD payment gateway** integration quirks (sandbox↔prod gaps, webhook reliability, reconciliation). *Mitigation:* idempotent webhook handling, signature verification, manual reconciliation tooling.
- **Store rejections** (permissions, policy, content). *Mitigation:* pre-submission compliance checklist; staged rollout.
- **Perf regressions** on low-end devices surfacing only at launch scale. *Mitigation:* profile on real budget hardware before submit.

**Acceptance Criteria**
- [ ] A user **subscribes** to T0 or T1 via SSLCommerz/bKash/Nagad and is **recurringly billed**; a successful payment **activates the tier** via the entitlements engine.
- [ ] Lapsed/failed payment moves the org to **grace → lapsed**, adjusting entitlements **without** feature code touching payment state.
- [ ] Payment **webhooks are signature-verified and idempotent**; no double-activation.
- [ ] **Security review** passes: RLS + tRPC guard cover all tenant/tier paths; no leaked secrets/PII.
- [ ] **Performance** meets agreed budgets on a low-end Android reference device.
- [ ] App **accepted/published** to the store via EAS submit.

---

## Later phases (same app, same backend)

These tiers light up **additively** — all five tiers are modeled from M0, the core/API is decoupled, and a future web surface can be added without backend change (ADR-0001/0006/0007). No re-architecture expected.

| Milestone | Tier | Scope (brief) |
|---|---|---|
| **M4** | **T2 — Commerce** | Storefront **website**, **inventory** management, **courier** integration (delivery booking/tracking). |
| **M5** | **T3 — CRM & Growth** | Customer relationship management, segmentation, growth/marketing tooling on the existing data. |
| **M6** | **T4 — Business Intelligence** | **BI dashboards rendered in-app** via cross-platform charts (and, if web usage dominates, an optional dedicated web surface against the same tRPC API — ADR-0001's escape hatch). |
