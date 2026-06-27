# Deployment

> How **Aropon** ships. Optimized for Bangladesh latency (Singapore region), offline-first mobile clients, and safe, reversible releases.

---

## 1. Environments

| Env | Purpose | Mobile | API | Database | Branch |
| --- | --- | --- | --- | --- | --- |
| **local** | Dev machine | Expo Dev Client + local API | `localhost:8787` (Hono) | Local Supabase (Docker) or branch DB | feature branches |
| **dev** | Shared integration | EAS `development` channel | Fly.io `aropon-api-dev` | Supabase dev project | merge to `develop` (optional) |
| **staging** | Pre-prod, E2E, QA, store review builds | EAS `preview`/`staging` channel | Fly.io `aropon-api-staging` | Supabase staging project | merge to `main` |
| **prod** | Live users | EAS `production` channel | Fly.io `aropon-api-prod` (SIN) | Supabase prod project (SIN) | tagged release |

Principles:
- Each environment has **fully isolated** Supabase projects, Upstash Redis, and secrets. No sharing across envs.
- All compute and data sit in or near **Singapore (`sin`)** for lowest BD latency.
- Config differs **only** via env vars (12-factor). No env-specific code branches except a typed `APP_ENV`.

---

## 2. Mobile — EAS Build / Submit / Update

### Channels & build profiles (`eas.json`)

| Profile | Distribution | Channel | Use |
| --- | --- | --- | --- |
| `development` | internal (dev client) | `development` | day-to-day dev |
| `preview` | internal (APK / ad-hoc) | `staging` | QA, stakeholder, store review candidate |
| `production` | store | `production` | Play Store / App Store |

### OTA updates (EAS Update)

- JS/asset-only changes ship via **EAS Update** over-the-air to the matching channel — no store review.
- **Runtime version** is tied to native ABI (`runtimeVersion: { policy: 'appVersion' }` or fingerprint). OTA updates only reach clients on a **compatible runtime**; native changes require a new build + store submission.
- Roll out production OTA **gradually** (`--rollout-percentage`) and watch Sentry crash-free rate before going to 100%.
- Channel → branch mapping lets staging validate an update before it's promoted to the production channel.

```bash
# Build
eas build --profile production --platform all

# Ship a JS-only fix OTA to staging, then promote
eas update --branch staging --message "fix(sync): reconcile duplicate invoices"
eas channel:edit production --branch staging      # promote validated update

# Submit native build to stores
eas submit --profile production --platform android
eas submit --profile production --platform ios
```

### Native build cadence

A **new native build + store submission** is required for: Expo SDK upgrades, new native modules/permissions, `app.config` native changes, or a runtime-version bump. Everything else prefers OTA.

---

## 3. App Store Submission

### Google Play (primary for BD)

- Tracks: **internal → closed (QA) → production** with **staged rollout** (start 10–20%, ramp to 100%).
- AAB built by EAS, submitted via `eas submit` (service-account JSON in EAS secrets).
- Data safety form, target API level, and Bangla store listing kept current. App signing by Google Play.

### Apple App Store

- TestFlight (internal + external) → App Store review → phased release.
- ASC API key in EAS secrets. Privacy nutrition labels and export-compliance answered.
- Keep `bn` and `en` listing metadata and screenshots in sync.

> Maintain a `RELEASE_NOTES` (Bangla + English) per store release; reference the git tag.

---

## 4. API — Fly.io (Singapore)

`services/api` (Hono + tRPC) deploys as a Docker image to **Fly.io**, primary region `sin` (Railway `Southeast Asia` is the documented fallback).

- Multi-machine with health checks (`/healthz` liveness, `/readyz` checks DB + Redis).
- Autoscaling min 1 (so cold offline-sync reconnect bursts are absorbed); scale on CPU/conns.
- Zero-downtime **rolling** deploys; `fly deploy --strategy rolling`. Connection draining on shutdown.
- Image built in CI (not on the box); pinned digests.

```bash
fly deploy --config fly.staging.toml --strategy rolling
fly deploy --config fly.prod.toml    --strategy rolling   # after staging is green
fly releases --app aropon-api-prod                         # history for rollback
```

---

## 5. Supabase & Database Migrations (Drizzle)

### Workflow

1. Edit Drizzle schema in `packages/db/schema`.
2. Generate migration: `pnpm --filter @aropon/db drizzle-kit generate` → timestamped SQL in `packages/db/migrations` (commit it; migrations are immutable once merged).
3. Review the SQL in the PR — flag destructive ops (drop/rename/type-narrow).
4. Apply in CI via `drizzle-kit migrate` (or `supabase db push` for Supabase-managed bits) against the target env's `DATABASE_URL`.

```bash
pnpm --filter @aropon/db drizzle-kit generate --name add-invoice-pdf-url
pnpm --filter @aropon/db drizzle-kit migrate    # uses DATABASE_URL for the env
```

### Rules

- **Migrations run before** the new API/app version that depends on them (ordering in the pipeline below).
- **Expand → migrate → contract** for breaking schema changes: add new column/table (deploy code that writes both), backfill, switch reads, then drop the old in a later release. Never break a deployed client.
- **RLS policies and pg enums are part of the migration** — never hand-edited in the dashboard. The schema in git is the source of truth.
- Test every migration on a **branch/staging clone** first; verify RLS still passes the integration suite.
- Backfills for large tables run as **Inngest jobs**, batched and idempotent — not inline in the migration.
- Supabase Storage bucket policies and Realtime publication changes are tracked as migrations too.

---

## 6. Upstash Redis

- Per-env Upstash Redis (REST) in Singapore for rate limiting, idempotency keys, ephemeral caches, and Inngest/queue coordination.
- Connection via `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (server-only secrets).
- Treated as **disposable cache** — never the source of truth. Flushing it must not lose data; rate-limit windows simply reset.

---

## 7. CI/CD — GitHub Actions

Pipeline stages (Turbo-cached, affected-aware). PRs run through `build`; deploys run on `main`/tags.

```
┌────────┐  ┌───────────┐  ┌──────┐  ┌───────┐  ┌──────────┐  ┌─────────┐  ┌────────┐
│ lint   │─▶│ typecheck │─▶│ test │─▶│ build │─▶│ migrate  │─▶│ deploy  │─▶│ verify │
└────────┘  └───────────┘  └──────┘  └───────┘  └──────────┘  └─────────┘  └────────┘
```

| Stage | Command | Runs on |
| --- | --- | --- |
| lint | `turbo lint` | every PR |
| typecheck | `turbo typecheck` | every PR |
| test | `turbo test` + integration (Postgres service) + RLS + sync | every PR |
| build | `turbo build`; Docker image for API; EAS build for native (when triggered) | PR + main |
| migrate | `drizzle-kit migrate` against target env | deploy only, **before** deploy |
| deploy | `fly deploy` (API) · `eas update`/`submit` (mobile) · Vercel (marketing) | main / tag |
| verify | health checks, smoke E2E, release marker | post-deploy |

Promotion flow:
- PR → squash-merge to `main` ⇒ auto-deploy **staging** (API + OTA to `staging` channel) + run full E2E.
- Tag `vX.Y.Z` (or manual approval `workflow_dispatch`) ⇒ **migrate prod → deploy prod API → promote OTA to `production` channel** (and native submit when version bumped).
- A required **manual approval gate** guards the prod job.

`apps/marketing` (Next.js) deploys to Vercel/Cloudflare on `main`, independent of the app release.

---

## 8. Secrets Management

- **Doppler** is the source of truth for server/CI secrets (per-env configs: `dev`, `staging`, `prod`). GitHub Actions pulls via the Doppler service token; Fly secrets synced from Doppler.
- **EAS Secrets** hold mobile build/submit secrets (Play service account, ASC key, Sentry auth token for source-map upload).
- Client gets **only** `EXPO_PUBLIC_*` values (Supabase URL + anon key, PostHog public key, API URL). Service-role keys, `ANTHROPIC_API_KEY`, Inngest signing key, `DATABASE_URL`, Upstash token live **only** server-side.
- Rotate keys on a schedule and immediately on suspected exposure. `.env.example` lists every var name (no values); CI fails if a required var is missing (validated by the Zod `EnvSchema`).
- **Never** commit secrets; secret scanning (gitleaks) runs in CI and pre-commit.

---

## 9. Rollback Strategy

| Layer | Rollback |
| --- | --- |
| **Mobile OTA** | `eas channel:rollout` to previous update or `eas update:republish` the last good update. Affects only OTA-compatible runtimes; rolls out in minutes. |
| **Mobile native** | Halt/roll back the Play staged rollout; previous version stays live for un-updated users. App Store: remove from sale / expedited fix (slower — hence OTA-first). |
| **API** | `fly releases` → `fly deploy --image <previous-digest>` (or `fly releases rollback`). Image-pinned, seconds-to-minutes. |
| **Database** | **No blind down-migration in prod.** Because we use expand→contract, the previous code still works against the migrated schema. To revert, deploy the previous API image (compatible) and write a new forward migration to undo if truly needed. PITR / nightly backup restore is the last resort for data corruption. |
| **Marketing** | Vercel instant rollback to prior deployment. |

Release safety:
- Every deploy is **reversible within one step**. If it isn't (destructive migration), it requires explicit sign-off and a tested restore plan.
- Feature-flag risky features (kill-switch via config/Redis) so we can disable without redeploying.
- Keep migrations and code deploys **decoupled** so either can roll back independently.

---

## 10. Observability at Deploy Time

| Tool | What | Hook |
| --- | --- | --- |
| **Sentry** | Crashes + errors (mobile RN, API, web) with release health | Upload source maps per EAS build & API deploy; tag events with `release` + `APP_ENV`; watch crash-free sessions during OTA rollout |
| **PostHog** | Product analytics, funnels, feature flags, session insight | `EXPO_PUBLIC_POSTHOG_KEY`; annotate releases; gate rollouts on flag |
| **Better Stack** | Uptime/heartbeat + log drain + on-call alerts | Monitors on `/healthz`, `/readyz`; Pino logs shipped from Fly; alert on error-rate/latency spikes |

Deploy-time procedure:
- CI creates a **Sentry release** and associates commits + uploads source maps (so stack traces de-minify).
- Post-deploy `verify` stage pings health endpoints and runs the smoke E2E before marking the release good.
- A deploy **annotation/marker** is sent to Sentry + PostHog + Better Stack so dashboards show "before/after this release".
- Watch for **15–30 min** after a prod deploy/OTA: crash-free rate, p95 API latency, error rate, sync-failure rate. Auto-alerts page on-call via Better Stack.

### Release checklist

- [ ] CI green through `verify`; coverage floors held.
- [ ] DB migration reviewed, non-destructive (or expand→contract), tested on staging clone, RLS suite passing.
- [ ] New secrets registered in Doppler/EAS for the target env; `EnvSchema` validates.
- [ ] Sentry release created + source maps uploaded; release tagged with `APP_ENV`.
- [ ] OTA vs native decision correct for the runtime version.
- [ ] Staged/gradual rollout configured (Play track %, EAS `--rollout-percentage`).
- [ ] Rollback path confirmed (previous image digest / last good update known).
- [ ] Bangla + English release notes prepared.
- [ ] On-call aware; dashboards (Sentry/PostHog/Better Stack) open during the watch window.
