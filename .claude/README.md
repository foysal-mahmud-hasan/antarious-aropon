# Aropon `.claude/` Documentation

This directory is the **single source of truth** for building Aropon. It is written so that any AI
assistant (Claude, Cursor, Copilot, Gemini, Windsurf, …) or new engineer can contribute effectively
with **zero prior context**. Start with the root [`../CLAUDE.md`](../CLAUDE.md) for the golden rules,
then navigate here.

## How to read this (recommended order)

1. **Product** — what we're building and for whom.
2. **Design** — the look, tokens, and responsive rules.
3. **Architecture** — how the system is built.
4. **Engineering** — how we write, test, and ship.
5. **Decisions (ADRs)** — why the big choices were made.
6. **Roadmap** — what we build, in what order.

## Map

### Product — `product/`
| File | What it covers |
|------|----------------|
| [`product/prd.md`](product/prd.md) | Product requirements: vision, target user, all 5 tiers (T0+T1 detailed), business rules, entities, NFRs, success metrics |
| [`product/user-journeys.md`](product/user-journeys.md) | Step-by-step T0 & T1 journeys + edge cases (offline, sync conflict, failed FB token, declined payment) |

### Design — `design/`
| File | What it covers |
|------|----------------|
| [`design/design-system.md`](design/design-system.md) | Token catalog (teal palette, typography, spacing, radius, shadows, motion) → Tamagui theme |
| [`design/ui-guidelines.md`](design/ui-guidelines.md) | Responsive breakpoints, adaptive shell (tabs↔sidebar), Bengali-first rules, a11y, states |
| [`design/component-rules.md`](design/component-rules.md) | Component API conventions, the core primitives, accessibility, theming-via-tokens |

### Architecture — `architecture/`
| File | What it covers |
|------|----------------|
| [`architecture/system-architecture.md`](architecture/system-architecture.md) | Overview, diagram, data flow (online + offline), stack table + justifications, deployment topology |
| [`architecture/folder-structure.md`](architecture/folder-structure.md) | Turborepo layout, what lives where, import boundaries |
| [`architecture/offline-sync.md`](architecture/offline-sync.md) | SQLite + Drizzle local store, PowerSync rules, conflict strategy, T0 offline guarantees |
| [`architecture/database-design.md`](architecture/database-design.md) | Schema, ER model, RLS, multi-tenancy, indexing |
| [`architecture/api-spec.md`](architecture/api-spec.md) | tRPC router structure, example procedures, error handling |
| [`architecture/auth.md`](architecture/auth.md) | Phone-OTP + email + social flows, sessions, account→org bootstrap |
| [`architecture/authorization.md`](architecture/authorization.md) | RLS + RBAC roles + entitlements engine |
| [`architecture/subscription-system.md`](architecture/subscription-system.md) | All-5-tiers entitlement map, billing lifecycle, upgrade/downgrade |
| [`architecture/feature-flags.md`](architecture/feature-flags.md) | Entitlements vs flags, `<TierGate>` contract, PostHog remote flags |
| [`architecture/state-management.md`](architecture/state-management.md) | TanStack Query + Zustand + Context patterns, offline cache coherence |
| [`architecture/background-jobs.md`](architecture/background-jobs.md) | Inngest functions, triggers, retries, idempotency |

### Engineering — `engineering/`
| File | What it covers |
|------|----------------|
| [`engineering/coding-standards.md`](engineering/coding-standards.md) | TS strictness, SOLID, error handling, no-mock-data, import boundaries, Definition of Done |
| [`engineering/naming-conventions.md`](engineering/naming-conventions.md) | Files, symbols, schemas, tables, env vars, commits/branches |
| [`engineering/testing-strategy.md`](engineering/testing-strategy.md) | Test pyramid, offline-sync tests, RLS/tier-gating tests, coverage, CI gating |
| [`engineering/deployment.md`](engineering/deployment.md) | Environments, EAS, API deploy, migrations, CI/CD, secrets, rollback, observability |

### Decisions — `decisions/`
ADRs (Accepted 2026-06-26): [0001 Expo over Capacitor](decisions/adr-0001-expo-over-capacitor.md) ·
[0002 Supabase + thin API](decisions/adr-0002-supabase-plus-thin-api.md) ·
[0003 Offline-first SQLite + PowerSync](decisions/adr-0003-offline-first-sqlite-powersync.md) ·
[0004 Drizzle ORM](decisions/adr-0004-drizzle-orm.md) ·
[0005 Tamagui design system](decisions/adr-0005-tamagui-design-system.md) ·
[0006 Entitlements & tier-gating](decisions/adr-0006-entitlements-and-tier-gating.md) ·
[0007 Monorepo Turborepo](decisions/adr-0007-monorepo-turborepo.md)

### Prompts & Roadmap
- [`prompts/templates.md`](prompts/templates.md) — reusable prompt templates for common tasks.
- [`roadmap.md`](roadmap.md) — milestones M0–M3 (built scope) + M4–M6 (later), with acceptance criteria.

### Research (reverse-engineering of the reference apps) — `research/`
| File | What it covers |
|------|----------------|
| [`research/comparison.md`](research/comparison.md) | Phase-2 comparison of the two reference apps + recommendations |
| [`research/feature-map.md`](research/feature-map.md) | Extracted routes & features from the feature reference |
| [`research/design-tokens.md`](research/design-tokens.md) | Verbatim design tokens extracted from the design reference (seed for `packages/ui`) |

## Status

**Phase: documentation + scaffolding.** No app feature code exists yet. Implementation (Phase 7)
begins only on explicit approval — see [`roadmap.md`](roadmap.md) and the approved plan at
`~/.claude/plans/aropon-rebuild-eager-hopper.md`.
