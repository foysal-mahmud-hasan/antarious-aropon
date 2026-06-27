# Aropon — AI Prompt Templates

Reusable prompt templates for working in the Aropon codebase. Each template lists **when to use**, **context to gather first**, a **fill-in-the-blanks prompt**, and a **done checklist**.

> **Read the ADRs first** (`.claude/decisions/`). They are authoritative. When in doubt, prefer the ADR.

## Project Rules (apply to EVERY task)

These are non-negotiable. Every template's checklist re-states the relevant ones.

1. **Offline-first** — the UI reads/writes **local SQLite (Drizzle)** as the source of truth and never blocks on the network. Sync via PowerSync. (ADR-0003)
2. **Tier-gating** — features are gated through the **central entitlements engine**: server-side via the **tRPC guard + RLS**, client-side mirrored via **`<TierGate>`**. Never gate on payment state; never trust the client for security. All five tiers are modeled even if unbuilt. (ADR-0006)
3. **Bengali-first i18n** — Bengali (`bn`) is the default/primary locale; English (`en`) secondary. **No user-facing string is hardcoded** — all come from `packages/i18n`.
4. **No hardcoded hex** — colors/spacing/typography come from **Tamagui tokens** (teal palette) only. (ADR-0005)
5. **No mock data** — wire to real local SQLite / tRPC / Supabase. Seed scripts are fine; fake in-component data is not.
6. **Types & schemas are shared** — define once in `packages/{db,validators,core,api}` and import; never re-declare a type or schema that already exists. (ADR-0004, ADR-0007)
7. **Money is integer poisha** — 1 BDT = 100 poisha; never floats. Prefer append-only/event-sourced financial records. (ADR-0003)
8. **Responsive parity** — every screen works as phone (tabs) and wide/desktop (sidebar). A stretched phone UI on desktop is a defect. (ADR-0005)

---

## 1. Add a new feature module

**When to use:** Introducing a new bounded feature (e.g., "expenses", "inbox", "brand-studio").

**Context to gather:**
- Which **tier(s)** own this feature? Required entitlement key.
- Does it persist data? Which **tables** (new or existing)? Offline-relevant?
- Routes/screens it adds; where it sits in the adaptive shell.
- Server procedures and integrations needed.

**Prompt:**
```
Add a new feature module "<feature-name>" for tier <T?>.

Domain: <what it does, in one paragraph>.
Data: <tables it reads/writes; new tables needed? offline-first?>.
Screens/routes: <list, with shell placement>.
Server: <tRPC procedures / integrations / jobs needed>.
Entitlement key: <e.g. feature.<name>>.

Follow ADRs 0003/0006/0007. Place pure logic in packages/core,
schema in packages/db, validators in packages/validators, UI in
packages/ui or apps/mobile feature folder. Wire offline-first, tier-gated,
Bengali-first. No hardcoded hex, no mock data, share all types/schemas.
```

**Done checklist:**
- [ ] Domain logic in `packages/core` (no UI/framework deps).
- [ ] Tables in `packages/db` (Postgres + SQLite dialects), migration generated, PowerSync sync rules updated. (ADR-0003/0004)
- [ ] Entitlement key added to the engine; server `tRPC guard` + RLS enforce it; `<TierGate>` mirrors client-side. (ADR-0006)
- [ ] Offline-first: writes hit local SQLite, reconcile on reconnect.
- [ ] All strings in `packages/i18n` (`bn` + `en`).
- [ ] Tokens only, responsive (phone + desktop), no mock data.
- [ ] Tests for core logic + a screen render test.

---

## 2. Add a new screen (responsive, tier-gated)

**When to use:** Adding a screen/route to the Expo app.

**Context to gather:**
- Route path (Expo Router), shell placement (tab vs. sidebar entry).
- Entitlement key + behavior when not entitled (hide vs. upsell).
- Data source (local SQLite query / tRPC), offline behavior.
- Phone and wide-viewport layouts.

**Prompt:**
```
Add a screen at route "<path>" for feature "<feature>".

Purpose: <what the user does here>.
Data: <local SQLite query and/or tRPC procedure>; offline behavior: <...>.
Tier: requires <entitlement key>; when not entitled: <hide | upsell card>.
Layout: phone = <...>, wide = <...> (must not be a stretched phone UI).

Use Tamagui tokens + responsive props (real media queries). Wrap gated parts
in <TierGate entitlement="<key>">. Strings from packages/i18n (bn default).
```

**Done checklist:**
- [ ] Route registered in Expo Router; correct shell placement (tabs↔sidebar).
- [ ] Responsive via Tamagui responsive props — verified on phone **and** desktop. (ADR-0005)
- [ ] `<TierGate>` wraps gated content; server still enforces. (ADR-0006)
- [ ] Reads local SQLite first; usable offline where applicable. (ADR-0003)
- [ ] All strings i18n (`bn`/`en`); tokens only; no mock data.
- [ ] Loading/empty/error states present.

---

## 3. Add a tRPC procedure + Zod schema

**When to use:** New server capability the client calls (logic, integration, job trigger).

**Context to gather:**
- Router it belongs to; query vs. mutation.
- Input/output shape → Zod schema in `packages/validators`.
- Required entitlement + tenant scoping.
- Side effects (DB writes, integration calls, job enqueue).

**Prompt:**
```
Add a tRPC <query|mutation> "<router>.<procedure>".

Input: <fields> -> define/extend Zod schema in packages/validators.
Output: <shape>.
Auth/tier: requires <entitlement key>; tenant-scoped to the caller's org.
Effects: <DB writes (Drizzle/Postgres) / integration / Inngest job>.

Enforce entitlement via the tRPC guard (ADR-0006). Validate with the shared
Zod schema. Reuse Drizzle types from packages/db. No business logic in the DB.
```

**Done checklist:**
- [ ] Zod input/output schema in `packages/validators` (shared, not re-declared).
- [ ] Procedure validates input; returns typed output (client infers types).
- [ ] `tRPC guard` checks entitlement; RLS backs it at the data layer. (ADR-0002/0006)
- [ ] Tenant scoping correct (org membership).
- [ ] Drizzle for DB access; money in integer poisha.
- [ ] Unit test for the procedure (incl. unauthorized/forbidden cases).

---

## 4. Add a Drizzle table + migration + RLS policy

**When to use:** New persisted entity (server Postgres and/or local SQLite).

**Context to gather:**
- Postgres-only, SQLite-only, or **synced** (both, via PowerSync)?
- Tenant column (org_id) and ownership; access rules → RLS.
- Money columns (integer poisha)? Append-only/event-sourced?
- Client-generated UUID PK (offline insert safety).

**Prompt:**
```
Add table "<table>" in packages/db.

Columns: <name: type, ...>; money columns in integer poisha.
PK: client-generated UUID. Tenant: org_id (FK).
Synced via PowerSync? <yes/no>. Mutability: <append-only/event-sourced | LWW(field)>.
Access: <who can read/write> -> RLS policy.

Define Postgres + SQLite dialects (lowest-common-denominator where they differ).
Generate the migration. Add/extend PowerSync sync rules. Add RLS policies on Postgres.
```

**Done checklist:**
- [ ] Drizzle schema for **both** dialects where synced; divergences documented. (ADR-0004)
- [ ] Migration generated (drizzle-kit) + on-device SQLite migration if local.
- [ ] **RLS policies** added on Postgres (tenant + tier). (ADR-0002/0006)
- [ ] **PowerSync sync rules** updated and aligned with the schema. (ADR-0003)
- [ ] UUID PK; money in poisha; append-only/event-sourced where financial.
- [ ] Seed/fixture (no mock data in components).

---

## 5. Create a UI component in packages/ui

**When to use:** A reusable, presentational component for the design system.

**Context to gather:**
- Is it truly reusable (→ `packages/ui`) or feature-specific (→ app feature folder)?
- Variants/sizes/states; responsive behavior; tokens used.
- Accessibility (labels, hit targets for low-end touch).

**Prompt:**
```
Create a reusable component "<Name>" in packages/ui.

Purpose: <...>. Variants: <...>. States: <default/disabled/loading/error>.
Responsive: <phone vs wide behavior>.

Build with Tamagui (styled + variants + responsive props). Tokens only
(teal palette) — no hardcoded hex. No business logic, no data fetching,
no i18n strings baked in (accept text via props/children).
```

**Done checklist:**
- [ ] Pure/presentational — no data fetching, no domain logic.
- [ ] Tamagui tokens only; responsive props; works phone + web. (ADR-0005)
- [ ] Variants/sizes typed; sensible defaults.
- [ ] Accessible (roles/labels, adequate touch targets).
- [ ] Strings passed in (not hardcoded); story/usage example.

---

## 6. Write tests for X

**When to use:** Covering new/changed logic, procedures, or screens.

**Context to gather:**
- What kind: pure core (unit), tRPC procedure, DB/RLS, or screen render?
- Offline + sync paths? Tier-gated branches? Money math?

**Prompt:**
```
Write tests for "<unit/feature>".

Cover: happy path; <edge cases>; unauthorized/forbidden (tier); offline write +
reconcile-on-reconnect (if applicable); money math in poisha (no float drift).

Test pure logic in packages/core directly. For procedures, assert entitlement
enforcement. For screens, assert responsive + gated rendering. No real network —
use the local SQLite + test doubles for integrations.
```

**Done checklist:**
- [ ] Core logic unit-tested in isolation.
- [ ] Entitlement/tier branches covered (allowed + forbidden). (ADR-0006)
- [ ] Offline write → sync reconcile path covered where relevant. (ADR-0003)
- [ ] Money assertions in integer poisha.
- [ ] No reliance on live external services; deterministic.

---

## 7. Author a new ADR

**When to use:** Making a consequential, hard-to-reverse architectural decision.

**Context to gather:**
- Next ADR number (`.claude/decisions/`); the forces/constraints; real alternatives.
- Honest trade-offs; a concrete "revisit when" trigger.

**Prompt:**
```
Write ADR-<NNNN> "<title>".

Context: <forces, constraints, why now>.
Decision: <what we chose, specifically>.
Alternatives: <each option + why rejected>.
Consequences: <positive + negative/trade-offs, honestly>.
Revisit when: <concrete trigger>.

Match the format of existing ADRs (Status: Accepted, <date>). Be specific and
honest about trade-offs; cross-reference related ADRs.
```

**Done checklist:**
- [ ] Follows house format (Title, Status, Context, Decision, Alternatives, Consequences, Revisit when).
- [ ] Alternatives each have a real "why rejected".
- [ ] Negative trade-offs stated honestly.
- [ ] Concrete revisit trigger; cross-links to related ADRs.
- [ ] File named `adr-NNNN-<slug>.md`.

---

## 8. Add an Inngest job

**When to use:** Background/async work: AI generation, sync reconciliation follow-ups, webhooks, scheduled tasks.

**Context to gather:**
- Trigger (event name / cron / webhook); idempotency key.
- Inputs (validated by Zod); tenant context; entitlement (if user-facing capability).
- Retries, timeouts, failure handling; what it writes back.

**Prompt:**
```
Add an Inngest function "<name>".

Trigger: <event "<name>" | cron | webhook>.
Input: <fields> (validate with shared Zod schema).
Work: <steps>. Idempotency: <key>. Retries/timeout: <...>.
Writes back: <DB tables / notifies client via realtime>.

Triggered from the thin API (ADR-0002). Tenant-scoped. Enforce entitlement if
this performs a tier-gated capability. Use Drizzle for DB; money in poisha.
```

**Done checklist:**
- [ ] Trigger + idempotency defined; safe to retry.
- [ ] Input validated with shared Zod schema; tenant-scoped.
- [ ] Entitlement enforced if gating a tier capability. (ADR-0006)
- [ ] Steps are resumable; timeouts/retries set; failures logged (Sentry).
- [ ] Writes via Drizzle; integers for money; client notified (realtime) if needed.
- [ ] Test with a mocked event payload.

---

## 9. Add an i18n string set

**When to use:** Any new user-facing copy, or localizing existing strings.

**Context to gather:**
- Namespace/feature; keys; **Bengali source copy** (primary) + English.
- Pluralization, interpolation, number/currency/date formatting (BDT, poisha→display).

**Prompt:**
```
Add i18n strings for "<feature/namespace>" in packages/i18n.

Keys + copy:
  <key>: bn="<বাংলা>", en="<English>"
  ...
Interpolation/plurals: <...>. Currency: format poisha -> "৳" display.

Bengali is the default locale. Add both bn and en. No string may be hardcoded
in components — reference these keys.
```

**Done checklist:**
- [ ] Keys added with **bn (primary)** and **en**.
- [ ] No hardcoded user-facing strings anywhere in the feature.
- [ ] Interpolation/plurals handled; currency formats from poisha to ৳ for display.
- [ ] Keys namespaced sensibly; reused where copy already exists.
