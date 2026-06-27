# State Management

> Four state systems, each with a clear job. Don't mix their responsibilities.
> - **PowerSync (local SQLite)** — the source of truth for **offline-first domain data** (products, orders, inventory, transactions, customers). Reactive queries against SQLite. See `offline-sync.md`.
> - **TanStack Query** — **server state** fetched over tRPC (server-computed/server-only data: finance summaries, AI results, billing, inbox sends).
> - **Zustand** — **light client state** (ephemeral UI, drafts, selections, active org id).
> - **React Context** — **cross-cutting providers** (theme, auth/session, i18n, the configured clients).

## 1. Who owns what

| State | System | Examples |
|---|---|---|
| Offline-first domain data | **PowerSync / SQLite (Drizzle)** | product list, order being built, stock, ledger, customers |
| Server-computed / server-only | **TanStack Query** | `finance.summary`, `ai.caption` result, `billing` status, inbox message send |
| Ephemeral UI / client | **Zustand** | active `orgId`, current filter, multi-step form draft, toasts, bottom-sheet open |
| App-wide singletons & providers | **React Context** | theme, session/user, locale, query client, trpc client |

Rule of thumb: **if it's persisted business data the user edits offline → PowerSync. If it comes from the server → TanStack Query. If it's UI scratch → Zustand. If everything needs it → Context.**

## 2. TanStack Query patterns

### Query keys
Keys are **structured, org-scoped arrays** so cache and invalidation are precise and never leak across tenants:

```ts
// packages/api/queryKeys.ts
export const qk = {
  finance: {
    summary: (orgId: string, from: string, to: string) => ["finance", "summary", orgId, from, to] as const,
  },
  billing: { current: (orgId: string) => ["billing", "current", orgId] as const },
  inbox:   { conversation: (orgId: string, id: string) => ["inbox", "conversation", orgId, id] as const },
  ai:      { caption: (orgId: string, productId: string) => ["ai", "caption", orgId, productId] as const },
};
```

- **`orgId` is always in the key** — switching org changes keys, so no cross-tenant cache bleed.
- Keys are produced by helpers (not inline arrays) to keep invalidation call sites consistent.

### tRPC + Query integration
The tRPC client is wired to TanStack Query (`@trpc/react-query` style) so procedures expose `useQuery`/`useMutation` with typed inputs/outputs from `packages/validators`.

```ts
const { data } = trpc.finance.summary.useQuery({ from, to });          // key derived from path+input
const checkout = trpc.billing.checkout.useMutation();
```

### Invalidation
- After a **mutation** that changes server-derived data, invalidate the affected keys (e.g. `billing.checkout` success → invalidate `billing.current`).
- Prefer **targeted invalidation** by key over blanket `invalidateQueries()`.
- **Cross-system invalidation:** a PowerSync sync completion can invalidate server-computed queries that depend on synced rows — see §6.

### Offline cache
- The query client uses a **persisted cache** (AsyncStorage-backed persister) so server data read while online is **available offline** (read-only).
- `networkMode: "offlineFirst"` — queries serve cached data immediately and refetch when connectivity returns.
- **Mutations** to server-only endpoints are **not** silently queued in Query — server-only actions (payments, AI, social send) are explicitly gated offline (`offline-sync.md` §5) and shown as "available when online". (Offline-first *domain* writes go through PowerSync, not Query.)
- Sensible `staleTime`/`gcTime` per domain (e.g. `billing.current` long stale; `inbox` short).

## 3. Zustand conventions

- **One store per concern**, small and flat. No god-store.
  ```ts
  // packages/core/stores/session-ui.ts
  export const useSessionUi = create<SessionUiState>((set) => ({
    activeOrgId: null,
    setActiveOrg: (id) => set({ activeOrgId: id }),
  }));
  ```
- Stores hold **ephemeral/client** state only — never a copy of server or PowerSync data (that creates two sources of truth). Derive from the owning system instead.
- **`activeOrgId`** lives in Zustand (and is persisted to secure/async storage) because it drives query keys, the `x-aropon-org` header, and PowerSync bucket selection — it's client intent, not server data.
- Persist only what must survive reload (active org, dismissed banners) via the persist middleware; keep transient UI (open/closed, hover) in-memory.
- Select narrowly (`useStore(s => s.field)`) to avoid needless re-renders.

## 4. React Context usage

Context provides **stable singletons and identity**, mounted once at the app root (`apps/mobile/app/_layout.tsx`):

| Provider | Provides |
|---|---|
| `ThemeProvider` (Tamagui) | theme tokens, light/dark, responsive shell |
| `AuthProvider` | session, `userId`, role/entitlements for active org, sign-in/out |
| `I18nProvider` | locale (`bn`/`en`), translations, BDT/date formatters |
| `QueryClientProvider` | the persisted TanStack Query client |
| `TRPCProvider` | configured tRPC client (auth header, org header) |
| `PowerSyncProvider` | the SQLite/PowerSync database handle + reactive hooks |

Context is for things that **rarely change and are needed everywhere**. Do **not** put frequently-changing values (form state, lists) in Context — that re-renders the tree; use Zustand/Query/PowerSync instead.

## 5. Forms (RHF + Zod) and where they sit

- Form state lives in **React Hook Form** (component-local), validated by the **Zod schema from `packages/validators`** — the same schema the server uses.
- On submit: **offline-first entities** are written to PowerSync/SQLite (optimistic); **server actions** call a tRPC mutation. Server Zod failures map back onto fields via the flattened error (`api-spec.md` §6).
- Multi-step draft that must survive navigation → mirror into a Zustand store; otherwise keep it in RHF.

## 6. How offline sync interacts with the query cache

PowerSync and TanStack Query own different data but must stay coherent:

1. **Reads don't overlap** — local-first data is read via PowerSync reactive queries (watch SQLite); server-computed data via TanStack Query. A screen may use both (e.g. an order list from PowerSync + a `finance.summary` from Query).
2. **Writes are optimistic locally** — a new order appears instantly via the PowerSync reactive query; no manual Query cache update needed for the list itself.
3. **Sync completion → invalidate dependent server queries.** A server-computed value (e.g. `finance.summary`, which the API computes from synced `transactions`) is stale after local writes sync up. The sync layer emits a "synced" signal; a small bridge invalidates the affected Query keys so they refetch the recomputed value:
   ```ts
   powerSync.onSynced((tables) => {
     if (tables.has("transactions") || tables.has("orders"))
       queryClient.invalidateQueries({ queryKey: ["finance"] });
   });
   ```
4. **Conflicts surface, not silently merge** — rejected uploads (`offline-sync.md` §4) populate a "needs attention" list, exposed via a Zustand store or a PowerSync-watched table, and rendered in the UI.
5. **Org switch resets both** — changing `activeOrgId` changes query keys (Query naturally drops the old org) and swaps PowerSync buckets; on sign-out, both caches are cleared and local buckets purged (`auth.md` §5).
