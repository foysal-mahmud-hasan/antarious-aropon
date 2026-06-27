# System Architecture

> **Audience:** Any AI assistant or engineer onboarding to Aropon with zero prior context. This is the authoritative top-level map. Read this first, then drill into the topic-specific docs in this folder.

## 1. What Aropon is

Aropon is a **mobile-first SaaS "business companion" for Bangladeshi MSMEs** (micro, small & medium enterprises). One application serves **five subscription tiers** (T0–T4). The product is **offline-first** (T0 "Offline Mode" must be fully usable with no connectivity and reconcile on reconnect), **AI-assisted** (captions, copywriting, finance insights, performance suggestions, AI logos), and **multi-tenant** (a user can own/belong to multiple businesses).

Design constraints that shape every decision below:

- **Low-end Android is the primary device.** Native performance and smooth chat/keyboard handling are non-negotiable.
- **Bangladesh connectivity is intermittent.** Offline-first is a core feature, not a nicety.
- **Phone numbers are the primary identity.** Phone OTP is the default auth path.
- **BDT mobile-money rails (bKash/Nagad/Rocket) dominate payments**, not cards.
- **One codebase, all surfaces.** Native iOS, native Android, and responsive web ship from the same code from milestone M0.

## 2. Approved stack (with justifications + rejected alternatives)

| Layer | Choice | One-line justification | Rejected alternative |
|---|---|---|---|
| Client framework | **Expo (latest SDK) + Expo Router + React Native Web** | One TS codebase → native iOS/Android + responsive web; best chat/keyboard on low-end Android | **Capacitor** (WebView jank on low-end Android, weaker chat/keyboard); **Flutter** (no TS code-sharing with backend) |
| Monorepo | **Turborepo + pnpm** | Cached task graph + strict workspace boundaries across `apps/*` and `packages/*` | Nx (heavier), single-package repo (no shared-package isolation) |
| UI / styling | **Tamagui** | Compiler-optimized cross-platform styling; responsive props compile to real CSS media queries → true responsive web from M0 | NativeWind (weaker web media-query story), Stylesheet-only (no shared design system) |
| Server state | **TanStack Query** (over tRPC) | Cache, dedup, background refetch, offline cache persistence | Redux Toolkit Query (heavier, more boilerplate) |
| Client state | **Zustand** | Tiny, hook-first store for ephemeral UI/client state | Redux (ceremony), MobX (proxy magic) |
| Cross-cutting state | **React Context** | theme / auth / i18n providers | Prop drilling, global singletons |
| Forms + validation | **React Hook Form + Zod** | Performant forms; Zod schemas live in `packages/validators` as the single source of truth shared client↔server | Formik + Yup (slower, weaker TS inference) |
| Local DB | **expo-sqlite + Drizzle** | SQLite is the on-device source of truth; Drizzle schema is reused on server Postgres | WatermelonDB (own ORM, no server reuse), AsyncStorage (not relational) |
| Sync engine | **PowerSync** | Bidirectional, conflict-aware sync between client SQLite and Supabase Postgres | Hand-rolled sync (error-prone), Replicache (no native SQLite story we need) |
| Backend platform | **Supabase** (Postgres + Auth + Storage + Realtime + RLS) | Managed Postgres backbone with auth, storage, realtime, row-level security | Firebase (document model, weak relational/RLS), raw RDS (more DevOps) |
| API layer | **Hono + tRPC** (thin, typed) | End-to-end type-safe business logic, 3rd-party integrations, job triggers; edge-friendly | Full **NestJS** (too much DevOps now); pure-BaaS (complex logic/jobs awkward) |
| ORM | **Drizzle** | Lightweight, SQL-first, edge-friendly; reused on client SQLite + server Postgres | Prisma (heavier engine, weaker edge/SQLite reuse) |
| Auth | **Supabase Auth** | Phone OTP primary (critical for BD) + email + Facebook/Google social | Auth0/Clerk (cost, less BD phone-OTP control) |
| AuthZ | **Postgres RLS + RBAC roles + entitlements engine** | Tenant isolation in the DB; roles for who-can-do-what; tier→feature mapping server-enforced | App-layer-only checks (bypassable), per-route ad hoc gates |
| Background jobs | **Inngest** | Durable, serverless-friendly functions with retries/idempotency | BullMQ (needs always-on workers + Redis ops), cron-only (no durability) |
| Cache / rate-limit | **Upstash Redis** | Serverless Redis for caching, locks, rate limits | Self-hosted Redis (ops burden) |
| File storage | **Supabase Storage** | Logos, receipts, product media; same auth/RLS model | S3 directly (separate auth plumbing) |
| AI | **Anthropic Claude** behind a provider interface (`packages/core/ai`) + image-gen provider | Captions, copywriting, finance insights, suggestions; swappable | Single hard-coded vendor call sites |
| Notifications | **Expo Push + Resend (email) + BD SMS gateway + Supabase Realtime (in-app)** | Right channel per context, BD-appropriate SMS | FCM-only (no email/SMS/in-app cohesion) |
| Payments | **SSLCommerz + bKash/Nagad direct** | Cards + bKash/Nagad/Rocket; direct rails for recurring BDT subscriptions | Stripe (limited BD mobile-money), single PSP (no fallback) |
| Logging | **Pino → Better Stack** | Structured logs shipped to managed log store | console.* (unstructured), self-hosted ELK |
| Monitoring | **Sentry** (mobile + API) | Crash + error + perf across surfaces | DIY error capture |
| Analytics + flags | **PostHog** | Product analytics + remote feature flags in one | Separate analytics + flag vendors |
| Testing | **Vitest + React Native Testing Library + Maestro + Playwright** | Unit / component / mobile-E2E / web-E2E | Jest (slower), Detox (flakier than Maestro for us) |
| CI/CD | **GitHub Actions + EAS (Build/Submit/Update OTA)** | Store builds + OTA updates without store review for JS-only changes | Bitrise/Codemagic (extra vendor) |
| API deploy | **Fly.io / Railway (Singapore region)** | Lowest latency to Bangladesh; managed Supabase + Upstash | Distant regions (latency), self-managed k8s (overkill) |
| Secrets | **Doppler / EAS secrets** | Centralized secret sync to CI + runtime | Plaintext env files |

## 3. AI models

The AI provider interface (`packages/core/ai`) wraps **Anthropic Claude** via the official `@anthropic-ai/sdk`, called only from the **server** (Hono/tRPC + Inngest jobs) so keys never reach the client.

- **Default model: `claude-opus-4-8`** — finance insights, performance suggestions, longer copywriting, anything reasoning-heavy. Use **adaptive thinking** (`thinking: { type: "adaptive" }`) for non-trivial work; default `output_config.effort` of `high`.
- **`claude-haiku-4-5`** — high-volume, latency-sensitive, low-complexity calls (short captions, quick rewrites) to control cost.
- Model IDs are config-driven (Doppler), never hard-coded at call sites, so we can re-baseline without code changes.

See `api-spec.md` (the `ai` router) and `background-jobs.md` (scheduled AI insights) for usage.

## 4. Architecture diagram (logical)

```
                         ┌──────────────────────────────────────────────┐
                         │              CLIENT (one codebase)            │
                         │  Expo + Expo Router + React Native Web        │
                         │  ┌────────────────────────────────────────┐  │
                         │  │ UI: Tamagui (adaptive shell)           │  │
                         │  │   phone → bottom tabs                   │  │
                         │  │   desktop → sidebar + max-width content │  │
                         │  ├────────────────────────────────────────┤  │
                         │  │ State: TanStack Query (server)          │  │
                         │  │        Zustand (client) / Context       │  │
                         │  │ Forms: RHF + Zod (packages/validators)  │  │
                         │  ├────────────────────────────────────────┤  │
                         │  │ Local source of truth:                  │  │
                         │  │   expo-sqlite + Drizzle  ◀── reads/writes│  │
                         │  └───────────────┬────────────────────────┘  │
                         └──────────────────┼───────────────────────────┘
                                            │
              ┌─────────────────────────────┼──────────────────────────────┐
              │ (A) Sync path               │ (B) RPC path (online actions, │
              │     PowerSync               │     3rd-party, jobs, AI)       │
              ▼                              ▼
   ┌────────────────────┐        ┌──────────────────────────────┐
   │ PowerSync service  │        │ Hono + tRPC API (Fly/Railway, │
   │ (bidirectional,    │        │ Singapore)                    │
   │ conflict-aware)    │        │  • business logic             │
   └─────────┬──────────┘        │  • entitlements engine        │
             │                   │  • Meta Graph (FB/IG)         │
             │                   │  • payments (SSLCommerz/bKash)│
             │                   │  • triggers Inngest jobs      │
             ▼                   │  • calls Claude (server-only) │
   ┌──────────────────────────┐  └──────┬───────────┬───────────┘
   │       SUPABASE           │         │           │
   │  Postgres (RLS, org_id)  │◀────────┘           │
   │  Auth (phone/email/social)│                     │
   │  Storage  Realtime        │                     ▼
   └──────────────────────────┘        ┌──────────────────────────────┐
             ▲                          │ Inngest (durable jobs)       │
             │                          │  auto-replies, AI insights,  │
   ┌─────────┴───────────┐              │  FB/IG sync, order confirm   │
   │ Upstash Redis        │◀────────────┤  Upstash (cache/rate-limit)  │
   │ (cache, locks, RL)   │             │  Anthropic Claude            │
   └─────────────────────┘              │  Resend / SMS / Expo Push    │
                                        └──────────────────────────────┘
```

## 5. Data flow

### Online flow (e.g. create an order while connected)
1. User submits a form → **RHF + Zod** validate locally (schema from `packages/validators`).
2. Write lands in **local SQLite via Drizzle** immediately (optimistic, offline-first).
3. **PowerSync** streams the local change to **Supabase Postgres** (path A). RLS enforces `org_id` isolation.
4. For actions needing server logic (payment, FB/IG post, AI), the client also calls a **tRPC procedure** (path B). The server validates with the **same Zod schema**, runs business logic, and may enqueue an **Inngest** job.
5. **TanStack Query** caches server responses; PowerSync changes invalidate/hydrate relevant queries (see `state-management.md`).

### Offline flow (T0 "Offline Mode" / any tier offline)
1. All reads/writes go to **local SQLite** only — the app is fully functional.
2. Mutations are recorded locally; PowerSync queues outbound changes.
3. On reconnect, PowerSync **reconciles** using the conflict strategy in `offline-sync.md` (last-write-wins for low-risk fields, domain-specific merges for inventory/orders/ledger).
4. tRPC-only actions that require the server (payments, AI, social posting) are **disabled or deferred** offline and surfaced as "will run when online".

## 6. Multi-tenancy model

- **Tenant = `organization`** (a business). A user joins via a **`membership`** row carrying a **role** (`owner` / `manager` / `staff`).
- One user may own/belong to **multiple** organizations; the app has an org switcher.
- **Every tenant-scoped row carries `org_id`** and is isolated by **Postgres RLS** keyed on the caller's memberships. See `database-design.md` and `authorization.md`.

## 7. Deployment topology

| Component | Where | Notes |
|---|---|---|
| Mobile apps | **EAS Build/Submit** → App Store + Play Store | JS-only changes ship via **EAS Update (OTA)** without store review |
| Web app | Static export of the Expo app (React Native Web) on CDN | Same codebase; Tamagui media queries → responsive |
| Marketing site (optional) | **Next.js** `apps/marketing` | Landing only; not the product |
| API (Hono + tRPC) | **Fly.io / Railway, Singapore** | Closest low-latency region to Bangladesh |
| Background jobs | **Inngest** (serverless) | Durable, retried, idempotent |
| Database/Auth/Storage/Realtime | **Supabase** (managed) | Postgres + RLS is the backbone |
| Sync | **PowerSync** (managed) | Bridges SQLite ↔ Supabase |
| Cache / rate-limit | **Upstash Redis** (managed) | |
| Secrets | **Doppler** (runtime/CI) + **EAS secrets** (build) | |
| Observability | **Sentry** (crash/errors), **Pino → Better Stack** (logs), **PostHog** (analytics/flags) | |

## 8. Where to go next

- Repo layout & import boundaries → `folder-structure.md`
- Offline & sync internals → `offline-sync.md`
- Schema, RLS, indexing → `database-design.md`
- API surface → `api-spec.md`
- Identity → `auth.md`; permissions → `authorization.md`
- Plans & billing → `subscription-system.md`; gating → `feature-flags.md`
- Client state → `state-management.md`; async work → `background-jobs.md`
