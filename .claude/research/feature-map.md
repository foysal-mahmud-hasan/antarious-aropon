# Feature Map — extracted from the feature reference

> Source: https://aropon.vercel.app/choose-tier (the feature reference, an Expo / expo-router app).
> Routes and features below were reverse-engineered from the app's route manifest and bundles. This
> documents **what exists in the reference** for inspiration — the rebuild follows the product brief's
> five-tier structure, not the reference's legacy T1/T2 split. Mapping to the new tiers is noted.

## Route inventory (reference)

### Top-level
- `/` — index/home
- `/login`, `/login/t1`, `/login/t2` — tier-variant logins
- `/choose-tier` — subscription tier selection (primary onboarding entry)
- `/privacy`

### Tabbed app — `/(tabs)` (tier-conditional visibility)
- **index** — home/dashboard (status overview, quick actions, metrics)
- **bookkeeping** (`/bookkeeping/hub`) — finance hub (income/expense, reports)
- **orders** (`/orders/[id]`) — order management (status, payment, customer, channel, courier)
- **inventory** — stock management (levels, low-stock alerts, unit prices)
- **messages** — multi-channel inbox (`/messages/[id]`, `/approve`, `/auto-reply`,
  `/connect-channels`, `/order-confirm`, `/reply-templates`)
- **comments** (`/comments/templates`) — social comment management
- **courier** — Pathao / RedX / Steadfast integration
- **account** — profile, business info, settings

### Onboarding — `/(onboarding)`
- Base: `/welcome`, `/package`, `/ready`, `/loan-info`, `/loan-plan`, `/credit-preview`
- T1 path: `/t1/welcome`, `/package`, `/ready`, `/bookkeeping-intro`, `/calendar-intro`,
  `/channels`, `/credit-preview`, `/first-message`, `/loan-info`, `/loan-plan`
- T2 path: `/t2/welcome`, `/package`, `/ready`, `/website`

### Other modules
- `/loan` (`/index`, `/plan`, `/settings`) — installment (কিস্তি) tracking
- `/ngo` (`/my-connection`, `/receive-loan-plan`, `/share-khata`)
- `/courses` (`/[id]`, `/[id]/lesson/[lessonId]`) — training content
- `/credit-score`, `/insights`, `/calendar` (`/add-event`), `/website` (`/connect`, `/status`),
  `/transactions`, `/help`

## Feature → new-tier mapping

| Reference feature | New tier | Notes |
|---|---|---|
| Bookkeeping (income/expense) | **T0** | Must be **offline-first** in the rebuild |
| Brand Studio (AI logo/caption/copy) | **T0** | *Not present in reference* — new per brief |
| FB/IG integration, messages, comments, auto-reply, escalation | **T1** | Reference's `messages`/`comments` modules |
| Order confirmation | **T1** | Reference `/messages/order-confirm` |
| Revenue/Expense/Profit tracking | **T1** | Extends T0 bookkeeping |
| Daily/Weekly calendar | **T1** | Reference `/calendar` |
| AI finance insights + performance suggestions | **T1** | Reference `/insights` (expanded) |
| Website integration + order visibility | T2 (later) | Reference `/website` |
| Inventory (manual in / auto out) | T2 (later) | Reference `inventory` |
| Courier integration | T2 (later) | Reference `courier` (Pathao/RedX/Steadfast) |
| Lead capture, customer DB, scoring | T3 (later) | Not in reference; new per brief |
| Upsell/cross-sell automation | T3 (later) | New |
| Dashboards, summaries, analytics | T4 (later) | Partially in reference `/insights` |
| AI lead-closing support | T4 (later) | New |
| **Loan / NGO / credit-score / courses** | **Out of scope** | Reference-only modules; **not** in the brief — exclude from rebuild |

## Data shapes observed (reference, for reference only)

- **Order:** id, orderNumber, customerName/Phone, channel (website/facebook/instagram), address,
  items[{name, qty, price, unit}], total, status (pending/confirmed/delivered/cancelled),
  paymentStatus (due/paid), courier{partner, trackingId}.
- **Inventory item:** id, name, quantity, unit, pricePerUnit, status (adequate/low-stock).
- **Message:** id, conversationId, sender (customer/shop), text, time, channel (facebook/instagram/sms),
  product{title, code, image}, status (new/replied).
- **Business/User:** name, owner, email, phone, TIN, BIN, license, registration, address, tier.

> The rebuild's authoritative schema is in [`../architecture/database-design.md`](../architecture/database-design.md)
> — money is stored as **integer poisha**, inventory is **event-sourced (qty_delta)**, and everything
> is **org-scoped**. These reference shapes are inputs, not the final model.

## UX gaps to fix (from the reference)

- No real-time validation, error/empty/loading states, or offline indicators.
- No desktop layout (stretched mobile — see [`comparison.md`](comparison.md)).
- No team/roles, no audit log, no export.
- Auto-reply is template-only (the rebuild adds AI-assisted replies behind `packages/core/ai`).
