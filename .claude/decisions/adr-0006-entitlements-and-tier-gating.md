# ADR-0006: Central entitlements engine & tier-gating (decoupled from billing)

- **Status:** Accepted, 2026-06-26
- **Deciders:** Principal architect, backend lead, product
- **Tags:** entitlements, tiers, authorization, billing, security

## Context

Aropon ships **five subscription tiers (T0–T4)** in **one app**. We build **T0 and T1** first, but the UI, navigation, and data model must understand **all five tiers from day one** so that later tiers light up additively without restructuring.

Two failure modes to avoid:

1. **Scattered checks.** If "does this org have feature X?" is answered by ad-hoc conditionals sprinkled across screens and procedures, gating becomes inconsistent, unenforceable, and impossible to audit.
2. **Coupling gates to payment state.** If features check the *payment/billing* status directly, then trials, comps, grandfathering, promos, regional pricing, and grace periods all become tangled with payment plumbing — and a billing outage can wrongly lock users out.

## Decision

Build a **central entitlements engine** in **packages/core** (pure, framework-agnostic domain logic):

- A single mapping **subscription tier → feature set** (capabilities/limits), with **all five tiers modeled now** even though only T0/T1 features exist.
- Entitlements are **decoupled from billing**: billing *resolves* a tier (an input), and the engine *derives* capabilities from that tier. Trials/comps/grace periods set the effective tier; features never inspect payment state.

**Enforcement is server-authoritative, mirrored on the client:**

- **Server (authoritative):** a **tRPC guard** checks entitlements before executing protected procedures, and **RLS policies** enforce tenant + tier constraints at the data layer (defense in depth — ADR-0002).
- **Client (UX mirror):** a **`<TierGate>`** component (and matching hooks) reads the same entitlement definitions to show/hide/upsell features. Client gating is **UX only** — never trusted for security.

The entitlement definitions are **shared** (packages/core) so client and server reason from one source.

## Alternatives Considered

| Option | Why rejected |
|---|---|
| **Scattered per-feature checks** | Inconsistent, untestable, unauditable; impossible to reason about "what does T2 include?" centrally; every new tier touches many files. |
| **Gate directly on payment/billing state** | Tangles features with payment plumbing; breaks trials/comps/grandfathering/grace periods; a billing/webhook hiccup can wrongly revoke access. Tier must be an abstraction *over* billing, not billing itself. |
| **Client-only gating** | Trivially bypassable; not security. Server enforcement (tRPC guard + RLS) is mandatory; client is the mirror. |
| **Third-party entitlements SaaS (e.g., feature-flag/billing platforms)** | Added cost/lock-in and a poor fit for our offline-first, RLS-centric, BD-payments reality; revisit only if entitlement complexity explodes. |

## Consequences

**Positive**
- **One source of truth** for tier→feature mapping; auditable and testable in isolation (pure core).
- **Defense in depth**: tRPC guard + RLS server-side; `<TierGate>` for UX/upsell client-side.
- **Billing-independent**: trials, comps, grandfathering, and grace periods are natural (they just set the effective tier).
- **All tiers modeled now** → later tiers (T2–T4) activate additively, no re-architecture.

**Negative / trade-offs**
- **Two enforcement layers to keep in sync** (tRPC guard + RLS) — mitigated by deriving both from shared core definitions, but still requires discipline (mirrors ADR-0002 trade-off).
- Some **upfront modeling** of features that won't ship until M4–M6.
- Risk of **client/server divergence** if `<TierGate>` and server guards drift; must be tested together.

## Revisit when…

Entitlements grow beyond simple tier→feature mapping (per-seat limits, usage metering, add-on bundles, regional SKUs) such that a dedicated entitlements/metering system is justified, or if keeping tRPC-guard and RLS in sync proves error-prone and warrants codegen from the core definitions.
