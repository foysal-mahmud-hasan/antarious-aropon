# Folder Structure & Import Boundaries

> Turborepo + pnpm monorepo. `apps/*` are deployable surfaces; `packages/*` are shared libraries. The dependency rule is strict and one-directional: **apps depend on packages; packages never depend on apps.**

## 1. Top-level layout

```
aropon/
├── apps/
│   ├── mobile/            # THE product — Expo + Expo Router + RN Web (iOS, Android, Web)
│   └── marketing/         # Optional Next.js landing site (NOT the product)
├── packages/
│   ├── ui/                # Tamagui design system (components, tokens, themes, adaptive shell)
│   ├── core/              # Domain logic (entitlements, finance, orders) + ai/ provider layer
│   ├── api/               # tRPC CLIENT + shared router type imports (AppRouter type)
│   ├── db/                # Drizzle schema shared by server Postgres + client SQLite
│   ├── validators/        # Zod schemas — single source of truth, shared client ↔ server
│   ├── i18n/              # Locale catalogs (bn, en) + formatting helpers (BDT, dates)
│   └── config/            # Shared tsconfig, eslint, tamagui config, env schema
├── services/
│   └── api/               # Hono + tRPC SERVER (deployed to Fly/Railway) + Inngest functions
├── package.json           # workspace root scripts (turbo run …)
├── pnpm-workspace.yaml    # packages: apps/*, packages/*, services/*
├── turbo.json             # task graph (build/lint/typecheck/test/dev)
└── tsconfig.json          # base TS config (strict, bundler resolution)
```

> Note: `services/api` is the server runtime. `packages/api` is the **client** + the exported `AppRouter` **type** only — it ships no server code to the bundle. Keeping them separate is what makes tRPC end-to-end typing work without leaking server deps into the app.

## 2. What lives where

### `apps/mobile` (the product)
Expo Router file-based routes, screens, navigators, and the app shell wiring. Holds **no business logic** — it composes `packages/*`.

```
apps/mobile/
├── app/                   # Expo Router routes (file-based)
│   ├── (auth)/            # phone OTP, email, social sign-in
│   ├── (app)/             # authenticated app
│   │   ├── _layout.tsx    # adaptive shell: bottom-tabs (phone) ↔ sidebar (desktop)
│   │   ├── finance/
│   │   ├── orders/
│   │   ├── inbox/         # social/inbox (FB/IG conversations)
│   │   ├── brand-studio/  # AI captions, logos, copy
│   │   └── settings/      # org switcher, billing, members
│   └── _layout.tsx        # root providers (theme/auth/i18n/query)
├── components/            # app-only composite screens (use packages/ui primitives)
├── lib/                   # app wiring: query client, sqlite/powersync init, trpc client init
├── app.config.ts          # Expo config (plugins, EAS, scheme)
└── package.json
```

### `packages/ui` — Tamagui design system
Cross-platform primitives, tokens, themes, and the **adaptive shell** (responsive props that compile to CSS media queries on web). No data fetching, no domain logic.

### `packages/core` — domain logic + AI
Pure, framework-agnostic TS. Contains:
- `entitlements/` — the tier→feature engine (consumed by server and `<TierGate>`).
- `finance/`, `orders/`, `inventory/` — domain calculations and rules.
- `ai/` — the **provider interface** wrapping Anthropic Claude (`@anthropic-ai/sdk`) and the image-gen provider. **Server-only** (imported by `services/api` and Inngest), never bundled into the client.

### `packages/api` — tRPC client + router type
- `client.ts` — typed tRPC + TanStack Query client factory.
- `root.ts` (type-only re-export) — `export type { AppRouter } from "../../services/api/src/router"`. Importing the **type** keeps server code out of the client bundle.

### `packages/db` — Drizzle schema
The **shared** schema. Two dialects, one source:
- `schema/` — table definitions written once; compiled for **server Postgres** and the **client SQLite** subset (local-first tables). See `database-design.md` and `offline-sync.md`.
- `client.ts` / `server.ts` — dialect-specific Drizzle instances.

### `packages/validators` — Zod
Every input/output contract (forms, tRPC procedures, job payloads). **The single source of truth** — imported by RHF on the client and by tRPC on the server, so a schema change updates both ends at once.

### `packages/i18n`, `packages/config`
`i18n`: `bn` (Bengali, default) + `en` catalogs, BDT/number/date formatting. `config`: shared `tsconfig`, ESLint, Tamagui config, and the typed `env` schema (validated at boot).

### `services/api` — server runtime
Hono app exposing the tRPC router, the entitlements enforcement, 3rd-party integrations (Meta Graph, SSLCommerz/bKash/Nagad), and the **Inngest** function definitions. Imports `packages/{core,db,validators,config}`.

## 3. Import boundary rules

| From → To | Allowed? |
|---|---|
| `apps/*` → `packages/*` | ✅ |
| `services/api` → `packages/{core,db,validators,config,i18n}` | ✅ |
| `packages/*` → `apps/*` or `services/*` | ❌ never |
| `packages/ui` → `packages/{core,api,db}` | ❌ (UI is presentation-only; takes data via props) |
| `apps/mobile` → `packages/core/ai` | ❌ (AI is server-only; call it via tRPC) |
| `packages/api` (client) → `services/api` runtime code | ❌ — **type-only** imports of `AppRouter` |
| anything → `packages/validators` | ✅ (it's the shared contract) |

Enforced via `eslint-plugin-boundaries` + package `exports` maps + `tsconfig` project references. A package that needs another's internals is a design smell — lift the shared piece into `core`, `validators`, or `db`.

## 4. Naming conventions

- **Packages:** scoped `@aropon/<name>` (e.g. `@aropon/ui`, `@aropon/validators`).
- **Files:** `kebab-case.ts`; React components `PascalCase.tsx`. One component per file.
- **Zod schemas:** `nounVerbSchema` + inferred type `NounVerb` (e.g. `createOrderInput` → `type CreateOrderInput`).
- **tRPC:** routers are nouns (`orders`, `finance`); procedures are verbs (`orders.create`, `finance.summary`).
- **Drizzle tables:** snake_case plural (`order_items`); TS exports camelCase singular-ish (`orderItems`).
- **Routes (Expo Router):** group folders in parens `(auth)`, `(app)`; dynamic segments `[orderId]`.
- **Feature flags / entitlements keys:** dot-namespaced (`finance.insights`, `brand.ai_logo`) — see `feature-flags.md`.

## 5. TS / tooling baseline

- `strict: true`, `noUncheckedIndexedAccess: true`, `verbatimModuleSyntax: true`, `moduleResolution: "bundler"` (root `tsconfig.json`).
- Turbo tasks: `build`, `lint`, `typecheck`, `test`, `dev` — each package wires these; `^build` ensures dependency builds run first.
- pnpm workspace protocol (`workspace:*`) for all internal deps.
