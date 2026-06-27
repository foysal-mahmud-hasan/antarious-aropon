# Naming Conventions

> Conventions for **Aropon**. Consistency beats personal preference. When in doubt, match the closest existing example in the same package.

---

## 1. Quick Reference Table

| Category | Convention | Example | Anti-example |
| --- | --- | --- | --- |
| Source files (non-component) | `kebab-case.ts` | `invoice-calculator.ts` | `invoiceCalculator.ts` |
| React component files | `PascalCase.tsx` | `InvoiceCard.tsx` | `invoice-card.tsx` |
| Expo Router route files | framework convention | `app/(tabs)/invoices/[id].tsx` | `app/InvoicesScreen.tsx` |
| Folders | `kebab-case` | `use-cases/`, `invoice-list/` | `UseCases/` |
| Barrel / entry | `index.ts` | `packages/core/src/index.ts` | `main.ts` |
| Variables & functions | `camelCase` | `totalAmount`, `createInvoice()` | `TotalAmount`, `create_invoice` |
| Booleans | `is/has/can/should` prefix | `isPaid`, `hasOverdue`, `canExport` | `paid`, `overdue` |
| React components | `PascalCase` | `InvoiceCard`, `TierBadge` | `invoiceCard` |
| Hooks | `useXxx` camelCase | `useCreateInvoice`, `useSyncStatus` | `CreateInvoiceHook` |
| Types & interfaces | `PascalCase`, **no `I` prefix** | `Invoice`, `InvoiceRepository` | `IInvoice`, `TInvoice` |
| Type params (generics) | `T`, `K`, `V` or `TName` | `Result<T, E>`, `TInput` | `Type1` |
| Constants (module-level, fixed) | `SCREAMING_SNAKE_CASE` | `MAX_FREE_INVOICES`, `DEFAULT_VAT_RATE` | `maxFreeInvoices` |
| Enums (type + members) | `PascalCase` / `PascalCase` | `enum InvoiceStatus { Draft, Sent, Paid }` | `INVOICE_STATUS` |
| Zod schemas | `XxxSchema` | `InvoiceSchema`, `CreateInvoiceInputSchema` | `invoiceZod`, `zInvoice` |
| Inferred Zod types | `PascalCase` (= schema minus `Schema`) | `type Invoice = z.infer<typeof InvoiceSchema>` | `InvoiceType` |
| tRPC routers | `xxxRouter` camelCase | `invoiceRouter`, `paymentRouter` | `InvoiceRouter` |
| tRPC procedures | `camelCase` verb-first | `invoice.create`, `invoice.listByOrg` | `invoice.Create` |
| DB tables (Drizzle/Postgres) | `snake_case`, **plural** | `invoices`, `invoice_line_items` | `Invoice`, `invoiceLineItem` |
| DB columns | `snake_case` | `created_at`, `org_id`, `total_minor` | `createdAt`, `OrgId` |
| Drizzle table objects (TS) | `camelCase` plural | `export const invoices = pgTable('invoices', …)` | `Invoices` |
| Env vars | `SCREAMING_SNAKE` + prefix | `SUPABASE_SERVICE_ROLE_KEY`, `EXPO_PUBLIC_API_URL` | `apiUrl` |
| Unit/integration test files | `*.test.ts` | `invoice-calculator.test.ts` | `invoiceTests.ts` |
| Component/behaviour spec files | `*.spec.ts(x)` | `InvoiceCard.spec.tsx` | `InvoiceCard-test.tsx` |
| E2E flows (Maestro) | `kebab-case.yaml` | `create-invoice.yaml` | `CreateInvoice.yaml` |
| E2E flows (Playwright) | `*.e2e.ts` | `adaptive-shell.e2e.ts` | `shellTest.ts` |
| Git branches | `type/scope-short-desc` | `feat/invoices-pdf-export` | `myFix` |
| Commits | Conventional Commits | `feat(invoices): add PDF export` | `fixed stuff` |

---

## 2. Files & Folders

- **Files**: `kebab-case` for everything except files whose **default export is a React component**, which are `PascalCase.tsx` and match the component name (`InvoiceCard.tsx` exports `InvoiceCard`).
- **Folders**: always `kebab-case` (`use-cases`, `query-keys`, `invoice-list`).
- **Expo Router**: follow the framework — route groups `(tabs)`, dynamic segments `[id]`, layouts `_layout.tsx`. Keep heavy logic out of route files; they compose screens.
- **One primary export per file.** A file named `invoice-calculator.ts` exports the invoice calculator; co-locate small private helpers, but split when a file does two jobs.
- **Barrels**: each package exposes a single public `src/index.ts`. Internal modules live under `src/internal/` and are never imported across package boundaries.
- **Test files** sit next to the code they test (`invoice-calculator.ts` + `invoice-calculator.test.ts`) unless the package defines a `__tests__/` convention for integration suites.

---

## 3. Variables & Functions

- `camelCase` for all variables, parameters, and functions.
- Functions are **verb-first**: `createInvoice`, `calculateVat`, `formatBdt`, `syncPendingMutations`.
- Booleans read as predicates: `isOffline`, `hasUnsyncedChanges`, `canCreateInvoice`, `shouldRetry`.
- Avoid abbreviations except well-known ones (`id`, `url`, `vat`, `bdt`, `org`, `kyc`). No `inv`, `usr`, `qty` — write `invoice`, `user`, `quantity`.
- Money is stored and named in **minor units**: `totalMinor`, `priceMinor` (paisa). Display formatters convert. Never a bare `amount` that's ambiguous about units.
- Async functions returning data are still verb-first; don't suffix with `Async`.
- Event handlers: `handleXxx` for the implementation, `onXxx` for the prop (`<Button onPress={handleSubmit} />`).

---

## 4. Types, Interfaces, Enums

- `PascalCase`. **No `I` prefix, no `T` prefix** for plain types.
- Prefer the domain noun for the entity (`Invoice`) and `XxxInput` / `XxxOutput` for use-case/procedure payloads.
- Ports (interfaces implemented by adapters) describe a role: `InvoiceRepository`, `PaymentGateway`, `Clock`, `Logger`.
- **Enums**: use string-valued `enum` or `as const` unions. Members are `PascalCase`; the underlying string values are `snake_case` when persisted.

```ts
export enum InvoiceStatus {
  Draft = 'draft',
  Sent = 'sent',
  PartiallyPaid = 'partially_paid',
  Paid = 'paid',
  Void = 'void',
}
// or, preferred for serializable unions:
export const INVOICE_STATUSES = ['draft', 'sent', 'partially_paid', 'paid', 'void'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
```

- Generic type parameters: single uppercase letters for simple cases (`T`, `K`, `V`, `E`), descriptive `TXxx` when several appear (`TInput`, `TContext`).

---

## 5. Constants

- Module-level, truly fixed values: `SCREAMING_SNAKE_CASE` — `MAX_FREE_INVOICES`, `DEFAULT_VAT_RATE`, `SYNC_RETRY_BACKOFF_MS`, `BDT_LOCALE`.
- Group related constants in a `const` object with `as const` and a `PascalCase` name when they form a set: `export const TierLimits = { free: { invoices: 50 }, pro: { invoices: Infinity } } as const;`
- Configuration that changes per environment is **not** a constant — it's env-derived config (see §8).

---

## 6. Zod Schemas & Validators (`packages/validators`)

- Schema name = `PascalCase` entity + `Schema` suffix: `InvoiceSchema`, `CustomerSchema`.
- Input/output variants: `CreateInvoiceInputSchema`, `UpdateInvoiceInputSchema`, `InvoiceListOutputSchema`.
- Always export the inferred type with the clean entity name:

```ts
export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  status: z.enum(INVOICE_STATUSES),
  totalMinor: z.number().int().nonnegative(),
});
export type Invoice = z.infer<typeof InvoiceSchema>;
```

- One schema is the source of truth; do not duplicate field definitions across client and server.

---

## 7. tRPC Routers & Procedures (`services/api`)

- Routers: `camelCase` + `Router` — `invoiceRouter`, `paymentRouter`, `aiRouter`. Composed into `appRouter`.
- Procedures: `camelCase`, **verb-first**, called as `trpc.invoice.create`, `trpc.invoice.listByOrg`, `trpc.payment.record`.
- Read procedures use `query`, writes use `mutation`. Name them so it's obvious: `list`, `getById`, `create`, `update`, `void`, `record`.
- Procedure input/output schemas come from `packages/validators` (`CreateInvoiceInputSchema`).
- Middleware names describe the gate: `authedProcedure`, `orgScopedProcedure`, `tierGated('pro')`.

---

## 8. Database (Drizzle + Postgres)

- **Tables**: `snake_case`, **plural** — `invoices`, `customers`, `invoice_line_items`, `org_memberships`.
- **Columns**: `snake_case` — `id`, `org_id`, `created_at`, `updated_at`, `total_minor`, `is_archived`.
- **Standard columns** on every table: `id` (uuid pk), `org_id` (for RLS scoping), `created_at`, `updated_at`. Soft-delete uses `deleted_at` (nullable timestamptz).
- **Foreign keys**: `<singular_referenced_table>_id` → `customer_id`, `invoice_id`.
- **Indexes**: `idx_<table>_<columns>`; uniques `uq_<table>_<columns>`; FKs `fk_<table>_<ref>`.
- **Enums (pg)**: `snake_case` type name, e.g. `invoice_status`.
- The Drizzle TS object mirrors the table but is `camelCase` plural: `export const invoiceLineItems = pgTable('invoice_line_items', { … })`. Map snake_case columns to camelCase TS keys explicitly.
- **Migrations**: Drizzle-generated, timestamp-prefixed, with a short kebab description: `0007_add-invoice-pdf-url.sql`.

---

## 9. Environment Variables

- `SCREAMING_SNAKE_CASE`, always prefixed by scope:

| Prefix | Visibility | Examples |
| --- | --- | --- |
| `EXPO_PUBLIC_*` | Bundled into the client — **public** | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_POSTHOG_KEY` |
| `NEXT_PUBLIC_*` | Marketing site public | `NEXT_PUBLIC_SITE_URL` |
| (no prefix, server-only) | **Secret** — server/Inngest/CI only | `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `UPSTASH_REDIS_REST_URL`, `INNGEST_SIGNING_KEY`, `SENTRY_AUTH_TOKEN`, `DATABASE_URL` |

- **Rule**: if it's secret, it must **not** carry a `EXPO_PUBLIC_`/`NEXT_PUBLIC_` prefix. Anything public-prefixed is assumed compromised.
- Validate env at startup with a Zod `EnvSchema` (`packages/core/env` for server, app config for client). Fail fast on missing/invalid vars.
- Document every var in `.env.example` (no values); real values live in Doppler / EAS secrets.

---

## 10. Test File Naming

| Kind | Pattern | Runner |
| --- | --- | --- |
| Unit (pure logic) | `*.test.ts` | Vitest |
| Component / behaviour | `*.spec.tsx` | Vitest + RN Testing Library |
| Integration (tRPC + test DB) | `*.integration.test.ts` | Vitest |
| Offline-sync | `*.sync.test.ts` | Vitest |
| Mobile E2E flow | `flows/<flow>.yaml` | Maestro |
| Web E2E | `*.e2e.ts` | Playwright |
| Fixtures / factories | `*.fixture.ts`, `make-invoice.ts` | — |

---

## 11. Git Branches & Commits

### Branches

`<type>/<short-kebab-description>` — optionally `<type>/<scope>-<desc>`:

```
feat/invoices-pdf-export
fix/sync-duplicate-on-reconnect
chore/bump-expo-sdk
refactor/core-entitlement-strategy
```

Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `perf`, `build`, `ci`.

### Commits — Conventional Commits

```
<type>(<scope>): <imperative summary>

[optional body explaining why]

[optional footer: BREAKING CHANGE:, Refs #123]
```

Examples:

```
feat(invoices): add Bangla PDF export
fix(sync): reconcile duplicate invoices on reconnect
perf(api): batch customer lookups in invoice list
refactor(core): extract tier entitlement strategy
test(payments): cover partial payment rounding
chore(deps): bump expo to SDK 53
```

Rules:
- `type` from the list above; `scope` is usually a package or domain (`invoices`, `sync`, `api`, `ui`, `db`).
- Imperative mood, lowercase summary, no trailing period, ≤ 72 chars.
- Breaking changes: `!` after type/scope **and** a `BREAKING CHANGE:` footer.
- Enforced by `commitlint` (Husky `commit-msg` hook). Squash-merge PRs; the PR title is a Conventional Commit.
