# ADR-0004: Drizzle ORM (shared across client SQLite and server Postgres)

- **Status:** Accepted, 2026-06-26
- **Deciders:** Principal architect, data lead
- **Tags:** data, orm, schema, edge, code-sharing

## Context

We have **two databases that must agree**: on-device **SQLite** (local source of truth, ADR-0003) and server **Postgres** (Supabase, ADR-0002). PowerSync moves rows between them, so their schemas must stay structurally consistent.

We also deploy the API to an **edge/serverless runtime** (Hono, ADR-0002), where **cold-start time and bundle size matter**, and we want **schema/type definitions shared** as just-more-TypeScript across packages/db (ADR-0007).

## Decision

Adopt **Drizzle ORM** as the single ORM/schema layer:

- Define tables in **packages/db** as Drizzle schema (TypeScript).
- Use the **Postgres dialect** for the server (Supabase) and the **SQLite dialect** for the client (expo-sqlite), sharing column/shape definitions and inferred types wherever the dialects allow.
- **SQL-first** query building (Drizzle stays close to SQL — predictable queries, easy to reason about RLS interplay).
- Use **drizzle-kit** for migrations; generated types feed Zod/tRPC for end-to-end inference.

## Alternatives Considered

| Option | Why rejected |
|---|---|
| **Prisma** | **Heavier runtime** and historically a separate query engine → worse **cold starts** and larger bundles on edge/serverless. **Less edge-friendly**. Supporting **SQLite (client) + Postgres (server)** simultaneously is awkward in Prisma's dual-engine/generator model. Its high-level DSL also abstracts away the SQL we want visible next to RLS. |
| **Kysely** | Excellent typed query builder, but **not a schema/migration source of truth** — we'd bolt on migrations and lose the single-definition-shared-across-dialects benefit. |
| **Raw SQL + hand-written types** | Maximum control, maximum drift risk; no shared schema, no inference — the opposite of the consistency we need across two databases. |

## Consequences

**Positive**
- **One schema definition, two dialects** → client SQLite and server Postgres stay consistent, reducing sync/migration drift (critical for ADR-0003).
- **Edge-friendly**: small footprint, fast cold starts for the Hono/tRPC API.
- **SQL-first** keeps queries transparent and RLS-aware.
- Inferred types flow into Zod/tRPC for end-to-end type safety.

**Negative / trade-offs**
- **Dialect divergence is real**: not every Postgres feature (types, constraints, defaults) maps to SQLite. Shared tables need a **lowest-common-denominator discipline** and per-dialect overrides where they differ.
- **Two migration streams** (drizzle-kit for Postgres; on-device SQLite migrations) to keep in lockstep with PowerSync sync rules.
- Less "batteries-included" than Prisma (no Studio-grade GUI by default; more manual relation handling).

## Revisit when…

Drizzle's SQLite⇄Postgres parity becomes a recurring source of bugs, the team needs richer modeling/tooling than Drizzle offers, or a future surface needs an ORM Drizzle doesn't serve well. Also revisit if PowerSync introduces a first-class schema integration that supersedes hand-maintained Drizzle SQLite schemas.
