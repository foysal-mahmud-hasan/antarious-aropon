# ADR-0002: Supabase + a thin Hono/tRPC API

- **Status:** Accepted, 2026-06-26
- **Deciders:** Principal architect, backend lead
- **Tags:** backend, auth, data, api, integrations

## Context

Aropon needs a backend that delivers, quickly and cheaply: Postgres, authentication (phone-OTP first), file storage (logos, media), realtime (inbox, sync signals), and **row-level multi-tenancy** for many MSME organizations on shared tables.

It *also* needs a place for genuine **business logic** that does not belong in the database or the client:

- Entitlements / tier-gating enforcement (ADR-0006).
- Third-party integrations: **Meta Graph API** (FB/IG messages, comments, posting — T1), **payments** (SSLCommerz/bKash/Nagad recurring — M3).
- Triggering and orchestrating **background jobs** (AI generation, sync reconciliation, webhooks).
- A **typed contract** the mobile/web client can consume with end-to-end type safety.

## Decision

Use **Supabase as the managed backbone**:

- **Postgres** as the system of record (server side), with **Drizzle** owning the schema (ADR-0004).
- **Auth** (phone-OTP), **Storage**, **Realtime**, and **Row-Level Security (RLS)** as the multi-tenant enforcement layer.

Add a **thin, typed application API** using **Hono + tRPC**:

- Hosts business logic, entitlement guards, integration adapters (Meta, payments), and job triggers.
- Exposes **tRPC procedures** validated by shared **Zod** schemas (packages/validators), giving the client full type inference.
- Deployable to an edge/serverless runtime (Hono is lightweight and edge-friendly), keeping ops minimal.

**Division of labor:** RLS is the *last line* of tenant defense at the data layer; the tRPC guard is the *first line* and the home of business rules. CRUD that's safe under RLS can go direct to Supabase from the client; anything privileged, integrated, or rule-bearing goes through the API.

## Alternatives Considered

| Option | Why rejected |
|---|---|
| **Full NestJS backend** | Powerful and structured, but heavy **DevOps overhead now** (own Postgres, auth, storage, realtime, migrations infra, scaling). We'd be rebuilding what Supabase gives for free at our stage. Reconsider only if logic complexity outgrows a thin API. |
| **Pure BaaS (Supabase only, no API)** | Complex business logic, third-party integration orchestration, and background jobs become **awkward inside Postgres functions / edge functions** (testing, typing, secrets, retries). Also deepens **vendor lock-in** by pushing logic into DB/Edge primitives. A thin owned API keeps logic portable and testable. |
| **Firebase** | NoSQL document model fights our relational, multi-tenant, money-accurate domain; weaker SQL/RLS story; another ecosystem away from our Postgres/Drizzle/TS stack. |

## Consequences

**Positive**
- Fast time-to-value: auth, storage, realtime, RLS out of the box.
- Business logic lives in **owned, typed, testable** code (Hono/tRPC), not vendor primitives.
- End-to-end type safety from DB → API → client via Drizzle + Zod + tRPC.
- Clear seam to add surfaces later (web dashboard) against the same API.

**Negative / trade-offs**
- **Two backend pieces** to operate (Supabase project + the API service) and reason about.
- **Two enforcement points** (tRPC guard *and* RLS) must stay consistent — duplicated intent if not disciplined (mitigated by centralizing in the entitlements engine, ADR-0006).
- Some Supabase lock-in remains (auth, realtime, RLS semantics).

## Revisit when…

Business logic, job orchestration, or compliance needs **outgrow a thin API** (e.g., heavy workflow engines, complex transactional sagas), at which point a structured framework (NestJS) or splitting services may be warranted — or conversely, if Supabase Edge Functions mature enough to absorb the thin layer.
