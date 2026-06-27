# Aropon — Setup

Mobile-first SaaS for Bangladeshi MSMEs. One Expo app (all tiers), Supabase + thin tRPC API,
offline-first. This is the **M0 foundation**; see `.claude/roadmap.md` for what M1+ adds.

## Prerequisites

- Node 20 (`.nvmrc`) · pnpm 9.12.x (`corepack enable && corepack prepare pnpm@9.12.3 --activate`)
- For native runs: Xcode / Android Studio (or just use the web target / Expo Go)

## Install & verify

```bash
pnpm install
pnpm run typecheck   # all packages + app
pnpm run test        # core + i18n unit tests
```

## Run

```bash
# API (Hono + tRPC) — needs server env (see .env.example)
pnpm --filter @aropon/api-server dev

# App (Expo) — web / iOS / Android
pnpm --filter @aropon/mobile dev          # press w / i / a
pnpm --filter @aropon/mobile export:web   # production web bundle (proves responsive build)
```

## External services to provision (env in `.env.example`)

| Service | Used for | Needed by |
|---|---|---|
| **Supabase** | Postgres + Auth (phone-OTP) + Storage + Realtime + RLS | M0 auth, all data |
| **PowerSync** | Offline SQLite ⇄ Postgres sync | M0 sync path, M1 offline |
| **Anthropic** | Claude (captions, copy, insights) | M1 Brand Studio, M2 insights |
| **SSLCommerz / bKash / Nagad** | BDT recurring billing | M3 |
| **Sentry / PostHog** | Errors / analytics | M0 observability |
| **Upstash Redis**, **Resend** | cache/rate-limit, email | later |

> Supabase schema lives in `packages/db` (Drizzle). RLS policies + migrations are applied in the
> implementation step (`drizzle-kit` + Supabase). The local SQLite subset is `packages/db/src/local`.

## Workspace map

`apps/mobile` (Expo product app) · `services/api` (Hono+tRPC) · `packages/{ui,core,api,db,validators,i18n,config}`.
Rules and architecture: **`CLAUDE.md`** + **`.claude/`**.
