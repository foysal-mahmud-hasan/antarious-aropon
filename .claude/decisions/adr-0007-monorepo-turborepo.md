# ADR-0007: Monorepo with Turborepo + pnpm

- **Status:** Accepted, 2026-06-26
- **Deciders:** Principal architect, platform lead
- **Tags:** repo-structure, tooling, code-sharing, ci

## Context

Aropon spans a **mobile/web Expo app**, a **marketing site**, a **thin API service**, and substantial **shared domain logic** (entitlements core, DB schema, validators, UI, i18n). The single biggest velocity lever is **sharing types and schemas client↔server** (Drizzle schema ADR-0004, Zod validators + tRPC ADR-0002, entitlements core ADR-0006). We also need a clean seam to add a **future web surface** (ADR-0001) without forking the domain.

## Decision

Use a **Turborepo + pnpm** monorepo with this layout:

```
apps/
  mobile/        # Expo app (RN + RN Web) — the product, all tiers
  marketing/     # public marketing/landing site
services/
  api/           # thin Hono + tRPC API (ADR-0002)
packages/
  ui/            # Tamagui design system + components (ADR-0005)
  core/          # pure domain logic incl. entitlements engine (ADR-0006)
  api/           # tRPC routers/client contract (shared types)
  db/            # Drizzle schema + migrations, SQLite & Postgres (ADR-0004)
  validators/    # shared Zod schemas
  i18n/          # Bengali-first translation sets
  config/        # shared tsconfig/eslint/tamagui/build config
```

- **pnpm workspaces** for fast, disk-efficient installs and strict dependency boundaries.
- **Turborepo** for task orchestration with **caching** (build/lint/test/typecheck) and dependency-aware pipelines, locally and in CI.
- Domain/UI separation: feature code in apps composes from `packages/*`; **core has no UI/framework deps**.

## Alternatives Considered

| Option | Why rejected |
|---|---|
| **Polyrepo** (separate repos per app/service/lib) | **Cross-repo sync overhead**: shared types/schemas published as versioned packages, constant version bumps, painful coordinated changes. Kills the client↔server type-sharing benefit that motivates the whole stack. |
| **Single app, no packages** | **No domain/UI separation**: business logic entangled with screens, no shared core, and **no clean seam for a future web surface** (ADR-0001). Entitlements/DB/validators couldn't be shared cleanly with the API. |
| **Nx instead of Turborepo** | Powerful but heavier conventions/generators than we need now; Turborepo + pnpm is lighter and sufficient. Reconsider if we outgrow it. |

## Consequences

**Positive**
- **Type & schema sharing** client↔server is first-class (import, don't publish).
- **Clean separation**: pure `core`, `db`, `validators` reusable by any surface; UI isolated in `ui`.
- **Fast CI** via Turborepo caching and affected-graph task running.
- **Future web surface** drops in as another `apps/*` consuming the same packages — no domain fork (realizes ADR-0001's escape hatch).

**Negative / trade-offs**
- **Monorepo tooling complexity**: Metro/EAS must be configured for workspace resolution; occasional hoisting/symlink quirks with pnpm + RN.
- **Boundary discipline required**: without lint rules, packages can grow improper cross-deps (e.g., `core` importing UI).
- Single repo = **coupled CI surface**; a bad shared change can ripple (mitigated by typecheck/test gates).

## Revisit when…

The repo's build/CI times or contributor friction outgrow Turborepo's model (consider Nx or remote-cache scaling), or an app/service needs an independent release cadence/ownership that justifies extracting it to its own repo.
