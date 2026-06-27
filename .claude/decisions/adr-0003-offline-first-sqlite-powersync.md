# ADR-0003: Offline-first — local SQLite (Drizzle) + PowerSync to Supabase

- **Status:** Accepted, 2026-06-26
- **Deciders:** Principal architect, mobile lead, data lead
- **Tags:** offline, sync, data, money-accuracy, T0

## Context

**Tier 0 is literally "Offline Mode."** The product promise: a shopkeeper records income/expense **fully offline** (airplane mode, dead zone, no data balance) and the data **reconciles automatically on reconnect**. This is the headline value of the cheapest tier and our beachhead feature.

Reality check: **neither reference app implemented real offline.** They were online-first with optimistic caches that broke under genuine disconnection. We are committing to *real* local-first persistence, not a cache.

The domain is **money**. Sync conflicts must never silently corrupt a balance, double-count a sale, or lose an expense. Conflict handling is a first-class design concern, not an afterthought.

## Decision

**The local SQLite database is the source of truth on-device.**

- **expo-sqlite** as the embedded store; **Drizzle** defines and queries the local schema (same Drizzle dialect family reused server-side — ADR-0004).
- The UI reads/writes **local SQLite only**; it never blocks on the network.
- **PowerSync** provides **bidirectional, conflict-aware sync** between local SQLite and **Supabase Postgres**, with sync rules scoping rows per tenant/org.

**Money & conflict strategy**
- **Integer money in poisha** (1 BDT = 100 poisha). No floats for currency, ever — store and compute in integer poisha; format for display only.
- Prefer **append-only / event-sourced** modeling for financial activity: transactions are immutable inserts (an "expense recorded" event), not in-place mutating rows. Edits/voids are new compensating events. This makes merges associative and order-tolerant — two devices appending offline simply union on reconnect, no destructive overwrite.
- For the rare genuinely-mutable record (e.g., a profile field), use **last-write-wins keyed by a server-authoritative timestamp**, documented per table.
- Client-generated **UUID primary keys** so offline inserts never collide on reconnect.

## Alternatives Considered

| Option | Why rejected |
|---|---|
| **WatermelonDB** | Mature RN offline DB, but its **sync is bring-your-own** (you implement the push/pull protocol and conflict resolution against your backend). That's exactly the hard, money-critical part we want a proven engine for. Also its own model/query layer, not Drizzle — loses schema reuse with the server. |
| **Legend-State + Supabase sync** | Great reactive local-first DX, but the **Supabase sync plugin is comparatively young** for money-grade, multi-table, conflict-aware reconciliation, and couples us to Legend's observable model. Higher risk for the T0 promise. |
| **Plain optimistic cache (React Query / online-first)** | This is what the references effectively did — **not real offline**. Fails the core T0 requirement (airplane-mode usability) the moment connectivity drops. |

## Consequences

**Positive**
- Delivers the literal T0 promise: full usability with **zero connectivity**, automatic reconciliation on reconnect.
- A **proven sync engine** (PowerSync) owns the hard problem (incremental, conflict-aware, tenant-scoped sync) instead of us hand-rolling it.
- Drizzle schema reuse keeps local and server tables consistent (ADR-0004).
- Event-sourced money + integer poisha → robust, auditable, merge-safe finances.

**Negative / trade-offs**
- **Operational + cost dependency on PowerSync** (another service, its sync-rules DSL to learn and maintain).
- **Schema discipline tax:** PowerSync sync rules and Postgres publication must stay aligned with Drizzle migrations; drift breaks sync.
- Event-sourcing adds modeling overhead (projections/aggregates to compute balances) vs. naive mutable rows.
- Local DB lifecycle to manage: migrations on-device, storage growth, and reset/restore flows.

## Revisit when…

PowerSync cost, sync-rule limits, or reliability become a constraint at scale, **or** the offline surface expands well beyond bookkeeping such that a different engine (or a maturing Legend-State/Supabase path) offers materially better fit. Re-evaluate the LWW vs. event-sourced split per-domain if non-financial mutable data grows.
