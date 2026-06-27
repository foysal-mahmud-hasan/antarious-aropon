# Testing Strategy

> How we test **Aropon**. The goal is confidence that real MSME workflows — create invoice, record payment, sync after being offline, respect tier limits — work, in Bangla and English, on flaky networks.

---

## 1. The Test Pyramid for This Stack

```
            ┌───────────────────────────┐
            │  E2E  (Maestro / Playwright) │   few, critical user journeys
            ├───────────────────────────┤
            │  Integration (tRPC + test PG) │   procedures, RLS, sync
            ├───────────────────────────┤
            │  Component (RNTL)             │   ui + screens
            ├───────────────────────────┤
            │  Unit (Vitest)                │   core, validators, utils
            └───────────────────────────┘
                   many, fast, cheap
```

| Layer | Tooling | What it covers | Where |
| --- | --- | --- | --- |
| Unit | **Vitest** | Pure domain logic, money/VAT math, entitlement rules, Zod validators, utils | `packages/core`, `packages/validators`, `packages/i18n` |
| Component | **React Native Testing Library** (Vitest/Jest runner) | Tamagui components, screen behaviour, accessibility, i18n rendering | `packages/ui`, `apps/mobile` |
| Integration | **Vitest** + ephemeral **Postgres** (Testcontainers/Docker) | tRPC procedures end-to-end against a real DB, RLS policies, repositories | `services/api`, `packages/db` |
| Offline-sync | **Vitest** + SQLite + mocked network | Mutation queue, airplane-mode → reconnect reconciliation, conflict resolution | `apps/mobile`, `packages/db` |
| E2E (mobile) | **Maestro** | Real device/emulator user flows | `apps/mobile/e2e` |
| E2E (web) | **Playwright** | RN Web / marketing responsive flows, adaptive-shell breakpoints | `apps/mobile` (web build), `apps/marketing` |

Aim for the bulk of logic coverage at the **unit** layer (fast, deterministic), a solid band of **integration** tests for the server/DB contract, and a **small, curated** set of E2E flows for the highest-value journeys.

---

## 2. Unit Tests (Vitest)

**Target: `packages/core`, `packages/validators`, `packages/i18n`, pure utils.**

- `core` is framework-free and pure, so tests are plain functions — no mocks needed for math/rules.
- Inject ports (`Clock`, `InvoiceRepository`, `Logger`) as in-memory fakes from `core/testing` — these are hand-written fakes, **not** mock libraries.
- Cover edge cases that bite MSMEs: rounding paisa, partial payments, VAT inclusive/exclusive, currency formatting in `bn` numerals, tier-limit boundaries (49 vs 50 invoices).
- Validators: assert both **accept** and **reject** cases for each Zod schema, including localized error mapping.

```ts
// packages/core/src/invoice/calculate-total.test.ts
import { describe, expect, it } from 'vitest';
import { calculateInvoiceTotal } from './calculate-total';

describe('calculateInvoiceTotal', () => {
  it('applies 7.5% VAT exclusive and rounds to paisa', () => {
    const r = calculateInvoiceTotal({ lines: [{ priceMinor: 10_000, qty: 3 }], vatRate: 0.075 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.totalMinor).toBe(32_250);
  });

  it('returns TIER_LIMIT when over the free quota', () => {
    const r = guardInvoiceQuota({ tier: 'free', currentCount: 50 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('TIER_LIMIT');
  });
});
```

---

## 3. Component Tests (React Native Testing Library)

**Target: `packages/ui` primitives and `apps/mobile` screens.**

- Test **behaviour and accessibility**, not implementation. Query by role/label/text, never by test-id-as-crutch (use `testID` only when there's no accessible alternative).
- Assert i18n: render under `bn` and `en` providers; verify the right strings and that nothing is hardcoded.
- Assert accessibility: every interactive element resolves by `accessibilityRole`/label; error states are announced.
- Mock the **network/tRPC** layer at the hook boundary (see §7), but render real Tamagui components and real Zustand stores.
- Cover empty states, loading, error, and the offline banner.

```tsx
// packages/ui/src/invoice-card/InvoiceCard.spec.tsx
import { render, screen } from '@testing-library/react-native';
import { InvoiceCard } from './InvoiceCard';

it('shows localized overdue badge in Bangla', () => {
  render(<InvoiceCard invoice={makeInvoice({ status: 'sent', overdue: true })} />, {
    wrapper: bnWrapper,
  });
  expect(screen.getByRole('text', { name: /মেয়াদোত্তীর্ণ/ })).toBeOnTheScreen();
});
```

---

## 4. Integration Tests (tRPC against test Postgres)

**Target: `services/api` routers + `packages/db` repositories.**

- Spin up a **real ephemeral Postgres** per suite via Testcontainers (or a dedicated `aropon_test` DB in CI). **Never** mock the database here — the point is the real SQL + RLS contract.
- Run Drizzle migrations against it before the suite; truncate between tests (transaction-per-test rollback where possible for speed).
- Call tRPC procedures through a **server-side caller** with a constructed `ctx` (authenticated user, org, tier) — exercising auth → org-scope → tier middleware → use-case → repository → DB.
- Assert both the returned data and the **persisted** rows.

```ts
// services/api/src/routers/invoice.integration.test.ts
it('create persists invoice scoped to caller org', async () => {
  const caller = appRouter.createCaller(ctxFor({ user: alice, org: orgA, tier: 'pro' }));
  const res = await caller.invoice.create(makeCreateInput());
  expect(res.id).toBeDefined();
  const row = await db.query.invoices.findFirst({ where: eq(invoices.id, res.id) });
  expect(row?.orgId).toBe(orgA.id);
});
```

### Testing RLS

RLS is security-critical, so it gets **dedicated tests** that connect as the **anon/authenticated role** (not the service role) using a JWT claim for the user/org:

- A user **cannot** read/update/delete rows belonging to another org (expect 0 rows / permission denied).
- A user **can** access their own org's rows.
- Soft-deleted (`deleted_at`) rows are excluded by policy where required.
- Run the same query as service-role to prove the data exists (so the failure is RLS, not absence).

```ts
it('blocks cross-org read via RLS', async () => {
  const asBob = dbAsUser(bob, orgB);             // RLS-enforced connection
  const rows = await asBob.select().from(invoices).where(eq(invoices.orgId, orgA.id));
  expect(rows).toHaveLength(0);                   // RLS hides orgA from Bob
});
```

### Testing tier-gating / entitlements

- Unit-test the entitlement **rules** in `core` (boundaries, upgrades, downgrades).
- Integration-test that the `tierGated(...)` middleware **rejects** a `free`-tier caller with a `FORBIDDEN` / `TIER_LIMIT` `TRPCError` and **allows** a `pro` caller — against the real DB count.
- Test downgrade behaviour: a `pro` org that exceeds `free` limits then downgrades is read-only over quota, not silently corrupted.

---

## 5. Offline-Sync Tests

This is Aropon's highest-risk area (expo-sqlite + PowerSync + reconnect). Treat it as a first-class suite.

Scenarios to cover (`*.sync.test.ts`):

- [ ] **Offline create** → mutation queued in SQLite, optimistic UI reflects it, no network call made.
- [ ] **Reconnect** → queued mutations flush in order, server returns canonical IDs, local rows reconcile (temp id → server id) with no duplicates.
- [ ] **Conflict**: same record edited on two devices offline → deterministic resolution (last-write-wins by `updated_at`, or domain merge rule) and no data loss of the losing field set where merge applies.
- [ ] **Partial failure**: one mutation in the batch fails (e.g. tier limit hit server-side) → it's surfaced/rolled back without blocking the rest.
- [ ] **Idempotency**: replaying the queue after a crash mid-flush does not double-insert (idempotency key honored).
- [ ] **RLS during sync**: a queued write for an org the user lost access to is rejected cleanly.

Implement by driving the real SQLite + sync engine with a **controllable fake network** (toggle online/offline, inject latency/failures). Assert on the reconciled SQLite state **and** the server DB state.

---

## 6. E2E Tests

### Mobile — Maestro

A small set of **critical journeys** on Android emulator (and iOS sim where feasible), run against a seeded staging-like backend:

- Onboarding + auth (phone/OTP) → create org.
- Create invoice → share/export PDF.
- Record a payment (full + partial).
- Go offline (toggle airplane mode in-flow) → create invoice → reconnect → verify it appears server-side.
- Hit a tier limit → see upgrade prompt.

Flows live in `apps/mobile/e2e/flows/*.yaml`, named in kebab-case.

### Web — Playwright

RN Web build + `apps/marketing`. Focus on **responsive / adaptive shell**:

- Verify the adaptive shell at each breakpoint (e.g. `compact < 600`, `medium 600–1024`, `expanded > 1024`): bottom-tabs vs. side-rail vs. side-nav render correctly and navigation works at each.
- Core flows render and are usable at mobile, tablet, and desktop widths.
- Keyboard navigation and visible focus on the marketing site and web app.
- Run at a representative matrix of viewports; snapshot critical layouts.

```ts
// apps/mobile/e2e/adaptive-shell.e2e.ts
for (const vp of [{ w: 390 }, { w: 834 }, { w: 1440 }]) {
  test(`shell layout @${vp.w}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.w, height: 900 });
    await page.goto('/invoices');
    await expect(page.getByRole('navigation')).toBeVisible();
  });
}
```

---

## 7. What to Mock vs. Not

| Thing | Mock? | How |
| --- | --- | --- |
| `packages/core` domain logic | **No** | It's pure — test it directly |
| Database (integration/RLS) | **No** | Real ephemeral Postgres |
| Zod validators | **No** | Real schemas |
| SQLite / sync engine (sync tests) | **No** | Real expo-sqlite + PowerSync |
| Network availability (sync tests) | **Yes** | Controllable fake (online/offline toggle) |
| tRPC/network in component tests | **Yes** | Mock at the hook/query-client boundary |
| Time / `Date.now` | **Yes** | Inject a `Clock` port; use fake timers |
| Anthropic Claude API | **Yes** | Stub the client; assert prompt building + Zod-validate canned structured responses. **Never** call the real API in CI |
| Supabase Auth (component/unit) | **Yes** | Fake session; integration uses real JWT claims |
| Inngest | **Yes (unit)** | Test the function body directly with a fake event; **No** for a small set of dev-env e2e dispatches |
| Payment provider / external APIs | **Yes** | Contract-tested stub |

Golden rule: **mock at the system boundary, never the unit under test.** If a test mocks the thing it's supposed to verify, delete it.

---

## 8. Coverage Targets

| Package / area | Line | Branch | Notes |
| --- | --- | --- | --- |
| `packages/core` | **90%** | 85% | Business rules — highest bar |
| `packages/validators` | 90% | 85% | All accept/reject branches |
| `services/api` (procedures) | 80% | 75% | Via integration tests |
| `packages/ui` | 70% | — | Behaviour over pixels |
| `apps/mobile` screens | 65% | — | Critical screens prioritized |
| Sync engine wiring | 85% | 80% | High-risk |

- Coverage is a **floor that ratchets up**, never a ceiling. New code in `core` should not drop coverage.
- Coverage is reported per-package by Vitest (`v8` provider) and uploaded (Codecov) per PR.
- We do **not** chase 100% — untested code must be a deliberate, justified choice, not the default.

---

## 9. Test Data & Fixtures

- **Factories, not literals.** `packages/validators` (or `packages/core/testing`) exports `makeInvoice(overrides?)`, `makeCustomer()`, `makeOrg()` returning schema-valid objects. Tests override only the fields under test.
- Factories produce **valid** data by default (parse-checked against the Zod schema) so a schema change breaks fixtures loudly.
- DB seed for integration/E2E lives in `packages/db/seed` with deterministic IDs and a known cast (orgA/orgB, alice/bob, free/pro tiers) so RLS and tier tests read clearly.
- No shared mutable fixture state between tests — each test builds what it needs; DB suites reset between tests.
- Bangla and English content fixtures so i18n is exercised, not assumed.

---

## 10. CI Gating

Pipeline (Turbo-cached, affected-only where possible) — **all must pass to merge**:

```
lint → typecheck → unit → component → integration(+RLS) → build → e2e(smoke)
```

| Stage | Blocks merge? | Runs on |
| --- | --- | --- |
| `turbo lint` | Yes | every PR |
| `turbo typecheck` | Yes | every PR |
| Vitest unit + component | Yes | every PR |
| Integration + RLS (Postgres service container) | Yes | every PR |
| Coverage thresholds | Yes (per-package floors) | every PR |
| Maestro / Playwright **smoke** subset | Yes | every PR |
| Full Maestro / Playwright suite | Yes to deploy | merge to `main`, nightly |
| Sync suite | Yes | every PR touching db/mobile/sync |

- PRs cannot merge with failing or skipped (`.only`/`.skip` left in) tests — a lint rule bans focused/skipped tests in committed code.
- Flaky tests are quarantined with an owner and a deadline, not left to rot.
- E2E runs against a disposable seeded environment; never against prod.

### Local pre-merge

```bash
pnpm turbo lint typecheck test          # fast inner loop (unit + component)
pnpm turbo test:integration             # requires Docker (Postgres)
pnpm --filter @aropon/mobile test:sync  # offline-sync suite
pnpm e2e:smoke                          # Maestro/Playwright smoke
```
