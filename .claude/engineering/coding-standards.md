# Coding Standards

> Engineering standards for **Aropon** — a mobile-first SaaS for Bangladeshi MSMEs.
> Stack: Turborepo + pnpm · Expo / Expo Router / React Native Web / Tamagui · Supabase (Postgres + Auth + Storage + Realtime + RLS) · Hono + tRPC · Drizzle ORM · offline-first (expo-sqlite + Drizzle + PowerSync) · TanStack Query + Zustand · React Hook Form + Zod · Inngest · Anthropic Claude · TypeScript everywhere.

These are non-negotiable conventions. If you must deviate, document **why** in a code comment and link the relevant ADR or issue.

---

## 1. TypeScript Strictness

TypeScript is the contract layer of the entire monorepo. We run the strictest reasonable configuration and treat type errors as build failures.

### Base `tsconfig` (in `packages/config/tsconfig/base.json`)

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,   // arr[i] is T | undefined
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "target": "ES2022",
    "lib": ["ES2022"]
  }
}
```

Every package extends this file. App/package-specific configs only add `lib` (e.g. `DOM` for web), `jsx`, and `paths`.

### Hard rules

- **No `any`.** Use `unknown` and narrow. `any` is allowed only in `.d.ts` shims for untyped third-party packages, with an `// eslint-disable-next-line` and a reason.
- **No non-null assertions (`!`)** to silence the compiler. Narrow properly or use a Zod parse at the boundary. The rare legitimate `!` (e.g. a ref guaranteed set after mount) must carry an inline comment.
- **No `as` casts across unrelated types.** Casting `X as unknown as Y` is banned outside test fixtures.
- **`noUncheckedIndexedAccess` is on** — always handle the `undefined` case when indexing arrays/records/maps. Prefer `.at()`, `for...of`, or explicit guards.
- **Discriminated unions over boolean soup.** Model state as `{ status: 'idle' } | { status: 'loading' } | { status: 'error'; error: AppError } | { status: 'ok'; data: T }`.
- **`type` for unions/aliases, `interface` for object shapes that may be extended/augmented.** Be consistent within a file.
- Export **types** with `export type` (enforced by `verbatimModuleSyntax`).

### Boundaries are typed at runtime

Anything crossing a trust boundary (network, SQLite, file, env, AI output, push payload) must be validated with a Zod schema from `packages/validators` — never trusted because TypeScript "says so". Compile-time types are erased; runtime data is not.

---

## 2. Architecture: SOLID + Modular Monorepo

### Package responsibilities

| Package | Owns | Must NOT contain |
| --- | --- | --- |
| `packages/core` | Pure domain logic: entities, use-cases, business rules, money/tax math, entitlement calculations | React, Expo, network calls, SQL, env access |
| `packages/db` | Drizzle schema (server + client), migrations, query builders | UI, business rules |
| `packages/validators` | Zod schemas + inferred types shared client/server | React, DB, network |
| `packages/api` | tRPC client, router type imports, query-key factories | Server-only secrets, DB driver |
| `packages/ui` | Tamagui components, design tokens, primitives | Feature/business logic, data fetching |
| `packages/i18n` | Locale resources (bn / en), formatters, `t()` setup | Business logic |
| `packages/config` | Shared tsconfig, ESLint, Prettier, Tailwind/Tamagui config | Runtime code |
| `services/api` | Hono server, tRPC routers, Inngest functions, Claude orchestration | UI |
| `apps/mobile` | Expo Router screens, navigation, app composition, offline sync wiring | Reusable domain logic (push down to `core`) |
| `apps/marketing` | Next.js landing/marketing | App business logic |

### Dependency direction (import boundaries)

Dependencies point **inward toward `core`**. Lower layers never import higher layers.

```
apps/mobile ─┐
apps/marketing ─┤
services/api ─┴─▶ packages/api ─▶ packages/validators ─▶ packages/core
              └─▶ packages/db ──▶ packages/validators ─▶ packages/core
              └─▶ packages/ui ──▶ packages/i18n
```

Rules enforced by `eslint-plugin-boundaries` and `eslint-plugin-import`:

- `packages/core` imports **nothing** from the workspace except other pure utilities. It is framework-free and testable in isolation.
- `packages/ui` never imports `packages/db`, `packages/api`, or `services/*`.
- `apps/*` never import from `services/api/src/**` directly — only the **types** re-exported through `packages/api`.
- No deep imports across packages: import from a package's public entry (`@aropon/core`), never `@aropon/core/src/internal/...`. Each package declares `exports` in its `package.json`.
- No circular dependencies. CI runs `pnpm dlx madge --circular`.

### SOLID applied here

- **S** — A module/file has one reason to change. A tRPC procedure orchestrates; it delegates business rules to a `core` use-case and persistence to a `db` repository.
- **O** — Extend via new use-cases/strategies, not by editing switch statements scattered across the app. Entitlement tiers are strategy objects, not `if (tier === 'pro')` checks sprinkled everywhere.
- **L** — Repository interfaces in `core` are honored by both the Postgres and SQLite implementations.
- **I** — Narrow interfaces. A screen depends on the exact use-case it needs, not a god-service.
- **D** — `core` defines ports (interfaces); `db`/`api` provide adapters. Inject dependencies; don't reach for singletons inside domain code.

---

## 3. Error Handling

We distinguish **expected domain outcomes** from **unexpected failures**.

### Result vs throw

| Situation | Pattern |
| --- | --- |
| Expected, recoverable domain outcome (validation failed, insufficient stock, tier limit hit) | Return a typed `Result<T, AppError>` from `core` |
| Truly exceptional / programmer error / infra failure (DB down, invariant broken) | `throw` an `AppError` subclass |
| Crossing the tRPC boundary | Convert to `TRPCError` with the correct code |

```ts
// packages/core/src/result.ts
export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
```

`core` use-cases return `Result`. Callers must handle both branches — no silent `value!`.

### Typed errors

```ts
// packages/core/src/errors.ts
export class AppError extends Error {
  constructor(
    readonly code: AppErrorCode,        // 'NOT_FOUND' | 'FORBIDDEN' | 'TIER_LIMIT' | ...
    message: string,
    readonly cause?: unknown,
    readonly meta?: Record<string, unknown>,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class TierLimitError extends AppError {
  constructor(meta: { feature: string; tier: string; limit: number }) {
    super('TIER_LIMIT', `Tier limit reached for ${meta.feature}`, undefined, meta);
  }
}
```

Never throw bare strings or plain `Error`. Never `catch (e) {}` and swallow — at minimum log with context and rethrow or convert.

### tRPC error mapping

A single error-formatter middleware maps `AppError.code` → `TRPCError.code`:

| `AppErrorCode` | `TRPCError` code | HTTP |
| --- | --- | --- |
| `VALIDATION` | `BAD_REQUEST` | 400 |
| `UNAUTHENTICATED` | `UNAUTHORIZED` | 401 |
| `FORBIDDEN` / `TIER_LIMIT` | `FORBIDDEN` | 403 |
| `NOT_FOUND` | `NOT_FOUND` | 404 |
| `CONFLICT` | `CONFLICT` | 409 |
| `RATE_LIMIT` | `TOO_MANY_REQUESTS` | 429 |
| `INTERNAL` / unknown | `INTERNAL_SERVER_ERROR` | 500 |

The formatter attaches a machine-readable `data.appCode` and the Zod `data.zodError` (in dev) so the client can localize messages via `packages/i18n`. **Never** leak stack traces, SQL, or secrets to the client in prod.

### Client-side

- Wrap fallible UI regions in error boundaries (`packages/ui/ErrorBoundary`).
- TanStack Query `onError` maps `appCode` → localized toast/inline message. Generic 500s show a "something went wrong" message and report to Sentry.

---

## 4. No Mock Data Rule

**Real persistence from day one.** This is a hard rule, not a preference.

- No hardcoded arrays of fake invoices/customers in screens or components.
- No `MOCK_USER`, `dummyData`, `setTimeout`-faked APIs in app code.
- New features wire through the real stack end-to-end: `validators` → `core` use-case → `db` repository (Postgres + SQLite) → tRPC procedure → TanStack Query → UI.
- Placeholder/seed data lives **only** in `packages/db/seed` (clearly labeled, dev/test only) and in test fixtures.
- Empty states are designed and built (real "you have no invoices yet" UI), not faked with sample rows.
- Storybook/Tamagui previews may use fixtures from `packages/validators`-derived factories, never inline literals copied around.

Rationale: offline-first + RLS + sync reconciliation only surface bugs when real persistence runs early. Mock data hides them until launch.

---

## 5. Separation of Domain Logic from UI

- Business rules live in `packages/core` and are **pure** and **synchronous-where-possible** (math, validation, entitlement checks). They take data in, return `Result` out.
- Components in `packages/ui` and screens in `apps/mobile` are **dumb about business rules**. They render state and dispatch intents.
- Data orchestration lives in tRPC procedures (server) and hooks in `packages/api` / app hooks (client). A screen calls `useCreateInvoice()`, not `db.insert(...)`.
- Zustand stores hold **ephemeral UI/session state** (selected tab, draft form, sync banner). They do **not** hold canonical domain data — that's TanStack Query (server cache) and SQLite (offline source of truth).

If you can't unit-test a rule without rendering a component or hitting the network, it's in the wrong place.

---

## 6. Async Patterns

- `async/await` only. No raw `.then()` chains in app/server code.
- Every `await` on I/O is inside a `try/catch` or a `Result`-returning helper. Unhandled rejections are CI-failing in tests.
- Use `Promise.all` / `Promise.allSettled` for independent concurrent work; never `await` in a loop when calls are independent.
- Pass an `AbortSignal` through long-running server work and Claude calls; honor cancellation.
- Server: bound concurrency for fan-out (e.g. `p-limit`) so we don't exhaust the Postgres pool or hit Anthropic rate limits.
- Offline mutations go through the PowerSync write queue / TanStack Query mutation queue — **never** fire-and-forget a network write that the user expects to persist.
- Inngest functions are idempotent: derive an idempotency key from the event so retries don't double-charge or double-send.
- AI calls (Claude) are always: validated input → bounded tokens → timeout → Zod-validated structured output → logged with `requestId`. Never `await anthropic...` directly inside a request handler without a timeout and fallback.

---

## 7. Logging (Pino)

- One Pino logger configured in `services/api` (`packages/core` exposes a logger *interface*, the server injects the Pino impl — domain code does not import Pino).
- Structured logs only — objects, not string concatenation: `logger.info({ userId, invoiceId, tier }, 'invoice.created')`.
- Levels: `error` (needs attention), `warn` (degraded/recoverable), `info` (business events), `debug` (dev only). Default prod level `info`.
- Every request gets a `requestId` (from Hono middleware) propagated through tRPC `ctx` and into Inngest events and Claude calls for traceability.
- **Redaction**: configure Pino `redact` for `authorization`, `password`, `token`, `*.phone`, `*.nid`, Supabase keys. Never log full request bodies containing PII.
- Client uses a lightweight logger that forwards `warn`/`error` to Sentry; no `console.log` left in committed app code (ESLint `no-console` with an allowlist for the logger module).

---

## 8. Comments & Documentation

- Comment **why**, not **what**. The code says what.
- Public exports of `core`, `validators`, `db`, and `api` carry TSDoc with at least a one-line summary; non-obvious params/returns get `@param`/`@returns`.
- Every non-trivial domain rule references the source of truth (e.g. `// VAT 7.5% per NBR SRO-xxx`).
- `TODO(owner):` and `FIXME(owner):` must name an owner and ideally link an issue. CI warns on ownerless TODOs.
- Architectural decisions get an ADR in `docs/adr/NNNN-title.md`.

---

## 9. Accessibility & i18n — Non-Negotiable

These are **acceptance criteria**, not polish.

### i18n

- **No hardcoded user-facing strings.** Every string goes through `packages/i18n` (`t('invoice.create.title')`).
- Default locale **Bangla (`bn`)**, with `en` parity. Both locales must have all keys (CI fails on missing keys).
- Use locale-aware formatting for currency (৳ BDT), numbers, and dates — never manual string building. Support Bangla numerals where the design calls for them.
- Pluralization via ICU message format, not `if (n === 1)`.
- Layouts must tolerate Bangla text length and font metrics; no fixed-width text containers that clip.

### Accessibility

- Every interactive element has an accessible label/role (`accessibilityLabel`, `accessibilityRole`) and a touch target ≥ 44×44 pt.
- Color is never the only signal; meet WCAG AA contrast against Tamagui tokens.
- Forms: inputs are labeled, errors announced, focus order logical.
- Web (RN Web / Next.js marketing): semantic HTML, keyboard navigable, visible focus states, responsive down to small viewports.
- Test with a screen reader (TalkBack) on critical flows (auth, create invoice, record payment).

---

## 10. Security Basics

- **No secrets in the client.** Anything in `apps/mobile` / `apps/marketing` is public. Only the Supabase **anon** key and public config ship to the client. Service-role keys, Anthropic keys, and webhook secrets live **only** in `services/api` env (Doppler / EAS secrets).
- **RLS-first.** Every Supabase table has Row Level Security enabled with explicit policies before it's used. The client talks to Postgres only through RLS-protected access; privileged operations go through tRPC procedures using a scoped server context. Never rely on client checks for authorization.
- Authorization is enforced server-side in tRPC middleware (auth → org membership → tier entitlement). Client-side gating is UX only.
- Validate **all** input with Zod at the tRPC boundary and before any DB write.
- Parameterized queries only (Drizzle handles this) — never string-build SQL.
- Treat AI output as untrusted: validate with Zod, never `eval`/execute it, never interpolate it into SQL or shell.
- Storage: signed URLs with short TTL; bucket policies enforce per-org isolation.
- Dependencies: `pnpm audit` in CI; Dependabot/Renovate for updates.

---

## 11. Lint & Format Tooling

### ESLint (flat config in `packages/config/eslint`)

- Base: `@eslint/js` recommended + `typescript-eslint` (type-checked rules) + `eslint-plugin-import` + `eslint-plugin-boundaries` + `eslint-plugin-react` / `eslint-plugin-react-hooks` (apps/ui) + `eslint-plugin-tailwindcss`/Tamagui where relevant + `eslint-plugin-unused-imports`.
- Key rules:
  - `@typescript-eslint/no-explicit-any: error`
  - `@typescript-eslint/no-non-null-assertion: error`
  - `@typescript-eslint/no-floating-promises: error`
  - `@typescript-eslint/consistent-type-imports: error`
  - `import/no-cycle: error`
  - `boundaries/element-types: error` (encodes the dependency-direction rules above)
  - `no-console: ['error', { allow: ['warn', 'error'] }]` (logger module exempt)
  - `react-hooks/exhaustive-deps: error`
- Each package has a thin `eslint.config.js` that imports the shared config and sets its layer.

### Prettier (`packages/config/prettier`)

```jsonc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### Enforcement

- **Pre-commit**: Husky + `lint-staged` runs ESLint `--fix` and Prettier on staged files; `tsc --noEmit` on affected packages via Turbo.
- **CI**: `turbo run lint typecheck` must pass. Formatting drift fails CI (`prettier --check`).
- Turbo caches lint/typecheck per package for speed.

---

## 12. Definition of Done

A change is **done** only when all of the following are true:

- [ ] Code compiles with zero TypeScript errors under the strict base config (`turbo typecheck`).
- [ ] ESLint and Prettier pass with no new disables (or each disable has a justifying comment).
- [ ] Business logic lives in `packages/core` and is covered by Vitest unit tests.
- [ ] All inputs crossing a boundary are validated with a Zod schema from `packages/validators`.
- [ ] Feature is wired to **real persistence** (Postgres + SQLite), not mock data.
- [ ] Works **offline**: mutation queues, syncs, and reconciles on reconnect (tested in airplane-mode path).
- [ ] RLS policies exist and are tested for any new/changed table; tier/entitlement gating enforced **server-side**.
- [ ] No secrets added to client code or committed; new secrets registered in Doppler/EAS.
- [ ] All user-facing strings localized in **both `bn` and `en`**; no missing i18n keys.
- [ ] Accessibility: labels, roles, contrast, touch targets verified on the changed surfaces.
- [ ] Errors are typed and mapped to the correct tRPC code; user sees a localized message; failures reported to Sentry.
- [ ] Structured logs added for key business events with `requestId`; no `console.log` left behind.
- [ ] Relevant tests added/updated (unit / component / integration / E2E as appropriate) and green in CI.
- [ ] Public APIs documented with TSDoc; ADR added if an architectural decision was made.
- [ ] PR follows Conventional Commits, is scoped/small, and has a passing CI pipeline.
