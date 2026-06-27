# Feature Flags & Gating

> Two distinct mechanisms, often confused — keep them separate:
> - **Entitlements** = *what a plan includes* (tier → features). Deterministic, billing-derived, **server-enforced** (`authorization.md`, `subscription-system.md`).
> - **Feature flags** = *whether a capability is switched on* (rollout, kill-switch, experiment). Operational, **remote via PostHog**, independent of plan.
>
> A feature is visible to a user only if **(entitlement says the plan includes it) AND (flag says it's enabled for them)**.

## 1. Entitlements vs feature flags

| | Entitlements | Feature flags (PostHog) |
|---|---|---|
| Question answered | "Does this org's **tier** include X?" | "Is capability X **turned on** for this user/org right now?" |
| Source of truth | `packages/core/entitlements` + `subscriptions` row | PostHog remote config |
| Changes when | Subscription tier/status changes | Ops toggles a rollout, runs an experiment, flips a kill-switch |
| Enforcement | **Server** (RLS/RBAC/`requireEntitlement`) + client `<TierGate>` mirror | **Client** primarily (UX); server checks flags for risky paths |
| Failure mode if bypassed | Hard `FORBIDDEN` from API/DB | Feature simply hidden/disabled; not a security boundary |
| Example | `finance.insights` requires T2+ | `inbox.newComposer` rolled out to 10% of orgs |

**Why both:** entitlements answer the *commercial* question (you must enforce it); flags answer the *delivery* question (ship dark, roll out gradually, kill a broken feature without a release). They compose — a T3 org with the AI-logo entitlement still won't see the new logo UI until the `brand.logoV2` flag is on for them.

## 2. The `<TierGate>` component contract

`<TierGate>` is the client surface for **entitlements** (it reads the resolved entitlements from auth context; it is UX, never security — the server still enforces).

```tsx
// packages/ui/gating/TierGate.tsx
type TierGateProps = {
  entitlement: EntitlementKey;            // e.g. "brand.ai_logo"
  min?: number;                            // for numeric limits: require value >= min (or unlimited)
  children: React.ReactNode;               // shown when entitled
  fallback?: React.ReactNode;              // shown when NOT entitled (default: <UpgradePrompt/>)
  mode?: "hide" | "upsell";               // hide entirely, or show an upgrade CTA (default: "upsell")
};

// Usage
<TierGate entitlement="finance.insights">
  <FinanceInsightsPanel />
</TierGate>

<TierGate entitlement="limits.products" min={currentProductCount + 1} mode="upsell"
          fallback={<UpgradePrompt reason="product_limit" />}>
  <AddProductButton />
</TierGate>
```

Contract:
- **Reads the same resolved `Entitlements`** the server uses (from `resolveEntitlements(tier, overrides)` in context) — client and server can't disagree.
- **Boolean entitlements:** renders `children` if truthy, else `fallback`.
- **Numeric entitlements (limits):** pass `min`; gate renders `children` if `value === -1` (unlimited) or `value >= min`, else `fallback`.
- **`mode="upsell"`** (default) renders an `<UpgradePrompt entitlement reason>` that deep-links to Settings → Billing with the target tier preselected. **`mode="hide"`** removes the node entirely (for features that shouldn't even hint at upsell).
- **Never the security boundary.** If a user forces the action, the server's `requireEntitlement` (`api-spec.md` §3) returns `FORBIDDEN: ENTITLEMENT_REQUIRED:<key>` and the client maps that error back to an `<UpgradePrompt>` (defense in depth + graceful handling).
- A sibling **`<RoleGate role="manager">`** does the same for RBAC roles (`authorization.md` §3) and surfaces `ROLE_REQUIRED` errors as a permission notice.

## 3. Remote flags via PostHog

PostHog is already the analytics tool (`system-architecture.md`); we reuse it for **feature flags** so flag exposure and product metrics live together.

- **Client init:** the PostHog SDK is initialized with the **user id** and **org id** as identity + group, so flags can target by user, by org, by tier, by cohort, or percentage rollout.
- **Reading a flag:**
  ```tsx
  // packages/core/flags/useFlag.ts
  const enabled = useFlag("inbox.newComposer");      // boolean rollout
  const variant = useFlagVariant("checkout.copyTest"); // multivariate experiment
  ```
- **Server reading a flag** (for risky/expensive paths, e.g. enabling a new AI pipeline): the API evaluates PostHog flags server-side with the same identity, so a kill-switch flips both ends.
- **Offline behavior:** the last-known flag payload is **cached locally** and used offline; flags refresh on reconnect. New users offline get the **safe defaults** baked into the build (`getFlagDefault(key)`), so a missing PostHog never enables something risky.
- **Naming:** dot-namespaced by domain (`inbox.newComposer`, `brand.logoV2`, `billing.bkashAutoCharge`). Document each flag's purpose and intended lifetime (rollout flags are temporary; kill-switches are long-lived).

## 4. Composing entitlement + flag

The common pattern — gate on both:

```tsx
function AiLogoEntry() {
  const logoV2 = useFlag("brand.logoV2");           // rollout/kill-switch
  if (!logoV2) return null;                          // not shipped to this user yet
  return (
    <TierGate entitlement="brand.ai_logo">           {/* plan must include it */}
      <AiLogoStudio />
    </TierGate>
  );
}
```

Decision order:
1. **Flag off?** Feature doesn't exist for this user — render nothing (ship-dark/kill-switch wins first).
2. **Flag on, entitlement missing?** Show upsell (commercial gate).
3. **Flag on + entitled?** Render the feature.

## 5. Guidelines

- **Don't encode pricing in PostHog.** Plan inclusion is an **entitlement**, defined in `subscription-system.md`; flags are for rollout/experiments only. Putting "is this a paid feature" in a flag would split the source of truth.
- **Don't use a flag as a security control.** Anything that must not be bypassed is an entitlement/role enforced on the server + RLS.
- **Every gated feature has a key in `packages/core/entitlements`** and (if rolling out) a documented PostHog flag — no inline booleans.
- **Clean up rollout flags** once a feature is 100% and stable; keep kill-switches.
