# Aropon — Product Requirements Document (PRD)

> **Audience:** This document is an AI-onboarding artifact. Any AI assistant (or new engineer) should be able to read it cold and understand what Aropon is, who it serves, how it is structured, and the rules that govern it — with zero prior context.

---

## 1. Product Vision

**Aropon** (অরপন) is a mobile-first SaaS **"business companion"** for Bangladeshi MSMEs (Micro, Small, and Medium Enterprises). It is delivered as **one single Expo (React Native) app** that hosts **all five subscription tiers**, with features unlocked by server-enforced **entitlements** based on the business's active subscription.

The vision: give a Bangladeshi small-business owner — who runs their shop primarily from a phone, sells largely through Facebook and Instagram, and thinks in Bengali and Bangladeshi Taka (৳/BDT) — a single app that grows with them. They start with offline bookkeeping and AI branding (Tier 0), then layer on social-commerce inbox + order management (Tier 1), then a website + inventory + courier (Tier 2), then CRM + growth automation (Tier 3), then full business intelligence (Tier 4). The same app, the same login, the same data — just more capability as they pay more.

### Build Order (important)
- **We build Tier 0 + Tier 1 FIRST.** These are the MVP.
- **Tiers 2–4 come later, in the same codebase.** No fork, no second app. Architecture must anticipate them but we do not build their features now.

---

## 2. Target User

| Attribute | Reality on the ground |
|---|---|
| **Who** | Owner-operators of micro/small businesses: home-based clothing sellers, food/cloud-kitchen owners, cosmetics resellers, handicraft makers, electronics resellers. |
| **Where** | Bangladesh — Dhaka, Chattogram, and increasingly district towns. |
| **Device** | Mobile-heavy. Often **low-end Android** (2–4 GB RAM, older chipsets, limited storage). iOS is a minority. |
| **Connectivity** | Intermittent. Mobile data on prepaid packs; Wi-Fi unreliable. Data cost is a real concern. |
| **Language** | **Bengali-first.** English is secondary. UI, AI output, and content must default to Bangla. |
| **Money** | Thinks in **BDT (৳)**. Mobile financial services dominate: **bKash, Nagad, Rocket**. Card/aggregator payments via **SSLCommerz**. |
| **Sales channel** | **Social commerce is central** — most selling happens in Facebook Page comments, Messenger, and Instagram DMs, not a website. "F-commerce" is the norm. |
| **Fulfilment** | Third-party couriers: **Pathao, RedX, Steadfast** (and Sundarban/Paperfly regionally). Cash-on-delivery (COD) is dominant. |
| **Skill level** | Not technically sophisticated. Low tolerance for complex setup. Trust and simplicity matter more than feature depth. |

---

## 3. Problem Statement

Bangladeshi MSME owners run their businesses across a chaos of disconnected tools:

1. **Bookkeeping is on paper or memory.** Cash in / cash out is tracked in a notebook (খাতা) or not at all. No reliable view of profit.
2. **Sales conversations are scattered.** Orders arrive via Messenger, Instagram DM, and Facebook comments simultaneously. Owners miss messages, lose orders, and reply slowly — losing customers.
3. **Order confirmation is manual and error-prone.** Confirming COD orders by re-messaging the customer ("apnar order ta confirm korchi") is repetitive and easy to drop.
4. **No branding capability.** They cannot afford a designer for a logo, captions, or product copy. Posts look unprofessional.
5. **No connectivity guarantee.** Existing SaaS tools assume always-on internet and English literacy. They break in a load-shedding, patchy-data environment.
6. **Tools don't grow with them.** A seller graduating from "Facebook only" to "website + courier + inventory" must switch products and re-enter everything.

**Aropon solves this** by being one Bengali-first, offline-capable, mobile app that consolidates bookkeeping, branding, social-commerce inbox, order confirmation, and finance insight — and that scales up through paid tiers without ever forcing the user to leave.

---

## 4. Tier & Feature Matrix (all 5 tiers)

> Pricing is per business, per month, in BDT. Entitlements are **server-enforced** (see Business Rules). A user may own multiple businesses, each with its own subscription tier.

### 4.1 Summary table

| Tier | Name | Price (BDT/mo) | Theme | Build phase |
|---|---|---|---|---|
| **T0** | Offline Mode | **200** | Bookkeeping + AI branding, fully offline | **MVP (now)** |
| **T1** | Social Commerce | **700–800** | FB/IG inbox, orders, finance, AI insight | **MVP (now)** |
| **T2** | Commerce | **1500–1700** | Website visibility, inventory, courier | Later |
| **T3** | CRM & Growth | **3000–3500** | Leads, customer DB, AI upsell/cross-sell | Later |
| **T4** | Business Intelligence | **5000–7000** | Reports, analytics, AI lead-closing | Later |

> Tiers are **cumulative in spirit**: a higher tier is expected to include the value of the lower ones. Exact inheritance of lower-tier features into higher tiers is an entitlement-config decision, but the product narrative is "more money = everything below + this tier's new powers."

### 4.2 Tier 0 — Offline Mode (200 BDT/mo) — DETAILED

**Constraint: T0 MUST work fully offline.** No feature in this tier may require network connectivity to function. Sync is opportunistic, not required.

| Module | Feature | Notes |
|---|---|---|
| **Finance / Bookkeeping** | Basic bookkeeping | Record cash-in (sales/revenue) and cash-out (expenses). Local-first storage; works with zero connectivity. |
| **Brand Studio** | AI Logo support | Help the owner produce a usable logo for their business. |
| **Brand Studio** | AI Caption generation | Generate Bangla (and optionally English) social captions for product posts. |
| **Brand Studio** | AI Copywriting | Generate product descriptions / promo copy in Bangla. |

> **AI + offline note:** AI generation (logo/caption/copy) ideally functions offline or degrades gracefully. Where on-device generation is not feasible, requests are **queued** and fulfilled on reconnect — but the **bookkeeping core must never be blocked** by connectivity. This trade-off is an explicit design constraint to resolve during implementation.

### 4.3 Tier 1 — Social Commerce (700–800 BDT/mo) — DETAILED

Builds on T0. Adds the social-commerce engine. Requires connectivity for the integration features (acceptable, because social commerce is inherently online).

| Module | Feature | Notes |
|---|---|---|
| **Integrations** | Facebook integration | Connect a Facebook Page (Pages, Messenger, comments) via OAuth/Meta Graph API. |
| **Integrations** | Instagram integration | Connect an Instagram Business/Creator account (DMs, comments) via Meta. |
| **Customer Communication** | Messages | Unified inbox of Messenger + Instagram DMs. |
| **Customer Communication** | Comments | View and reply to Facebook/Instagram post comments. |
| **Customer Communication** | Automated Replies | Rule/AI-based auto-replies (e.g., price/availability FAQs, greeting). |
| **Customer Communication** | Manual Escalation | Hand a conversation off from automation to a human (owner/staff). |
| **Orders** | Order Confirmation System | Capture an order from a conversation and confirm it (COD-friendly flow). |
| **Finance** | Basic Bookkeeping | Inherited/extends T0. |
| **Finance** | Revenue / Expense / Profit tracking | Aggregated financial view (৳). |
| **Calendar** | Daily view | Day-level schedule/agenda of orders, follow-ups, tasks. |
| **Calendar** | Weekly view | Week-level overview. |
| **AI Assistant** | Finance Insights | Plain-Bangla insight on cash flow, profit trends. |
| **AI Assistant** | Business Performance Suggestions | Actionable nudges ("respond faster to IG DMs", "your Tuesday sales dip"). |

### 4.4 Tier 2 — Commerce (1500–1700 BDT/mo) — OUTLINE

| Module | Feature | Notes |
|---|---|---|
| **Website** | Website Integration + Order Visibility | Surface orders coming from the seller's website alongside social orders. |
| **Website** | Website Templates | **Future.** Templated storefronts. |
| **Website** | Hosting Recommendations | **We do NOT host.** We recommend hosting providers only. |
| **Inventory** | Manual Stock Inflow | Owner records stock received. |
| **Inventory** | Automatic Stock Outflow | Confirmed orders auto-decrement stock. |
| **Logistics** | Courier Integration | Integrate **Pathao, RedX, Steadfast** for parcel booking + tracking. |

### 4.5 Tier 3 — CRM & Growth (3000–3500 BDT/mo) — OUTLINE

| Module | Feature | Notes |
|---|---|---|
| **Lead Capture** | Capture leads | From conversations/comments/website. |
| **Customer Data** | Name / Address / Phone | Structured customer records. |
| **Customer Data** | Customer Database | Searchable CRM of customers. |
| **Lead Scoring** | Lead Ranking / Scoring | Prioritise hot leads. |
| **AI Growth** | Upsell Automation | AI suggests/automates upsell offers. |
| **AI Growth** | Cross-sell Automation | AI suggests/automates cross-sell offers. |

### 4.6 Tier 4 — Business Intelligence (5000–7000 BDT/mo) — OUTLINE

| Module | Feature | Notes |
|---|---|---|
| **Reports** | Dashboard | Executive view of the business. |
| **Reports** | Daily / Weekly / Monthly Summary | Periodic rollups. |
| **Analytics** | Complaint Tracking | Track and categorise customer complaints. |
| **Analytics** | Best / Worst Selling Products | Product performance ranking. |
| **Analytics** | Peak Hour Analysis | When orders/messages spike. |
| **AI Assistant** | Lead Closing Support | AI assists in converting/closing leads. |

---

## 5. Business Rules

1. **Single app, entitlement-gated.** One Expo binary hosts all tiers. The UI reveals/locks features based on the active subscription's entitlements.
2. **Entitlements are SERVER-ENFORCED.** The client may hide locked features for UX, but the server is the source of truth. Every privileged action (e.g., connecting Facebook, sending an automated reply, reading analytics) is validated server-side against the business's entitlement set. Client-side gating alone is never trusted.
3. **Offline-first for Tier 0.** T0 bookkeeping and Brand Studio must be usable with no connectivity. Data is stored locally and synced opportunistically when a connection returns.
4. **Multi-tenant: one user may own multiple businesses.** A single user account can own/belong to several **Businesses** (Organizations). Each Business has its **own subscription tier**, its own data, and its own connected social accounts. Data is strictly isolated per Business (tenant).
5. **Roles within a Business:**
   - **Owner** — full control: billing, subscription, members, all data.
   - **Manager** — operational control: inbox, orders, finance entry, calendar; cannot manage billing or delete the business.
   - **Staff** — limited: handle assigned conversations/orders; no finance totals or billing unless granted.
6. **Per-business subscription & billing.** Subscription state (tier, status, renewal, grace period) is tracked per Business. Payment via mobile financial services (bKash, Nagad, Rocket) and SSLCommerz for cards.
7. **Bengali-first.** Default language is Bangla; English is an option. AI output defaults to Bangla.
8. **Currency is BDT (৳).** All money is stored and displayed in Bangladeshi Taka. No multi-currency in scope.
9. **Sync conflict resolution.** Offline edits sync on reconnect. Conflicts are resolved deterministically (last-write-wins per field with audit, or domain-specific merge for ledgers — append-only ledger preferred so transactions never conflict-overwrite).
10. **We do not host websites** (T2) and **we are not a payment processor** — we integrate existing rails and recommend hosting.

---

## 6. Key Entities (data model)

> Conceptual model. Names may map to tables/collections during implementation. All business-scoped entities carry a `business_id` for tenant isolation.

| Entity | Purpose | Key fields / relationships |
|---|---|---|
| **Organization / Business** | The tenant. A single shop/brand. | `id`, `name`, `logo`, `tier`, `created_by_user`. Owns all other business-scoped entities. A User may own many Businesses. |
| **User** | A person with an Aropon account. | `id`, `phone` (primary identity, OTP), `name`, `language_pref`. Authenticates via phone-OTP. |
| **Membership** | Links a User to a Business with a role. | `user_id`, `business_id`, `role` ∈ {owner, manager, staff}. Enforces multi-tenant access + roles. |
| **Subscription** | A Business's plan & billing state. | `business_id`, `tier` (0–4), `status` (active/grace/expired), `renewal_date`, `payment_method` (bKash/Nagad/Rocket/SSLCommerz). Source of entitlements. |
| **Transaction** | A bookkeeping ledger entry. | `business_id`, `type` (revenue/expense), `amount_bdt`, `category`, `note`, `occurred_at`, `sync_state`. Append-only for offline safety. |
| **Product / Inventory item** | A sellable item (full power in T2). | `business_id`, `name`, `price_bdt`, `stock_qty` (T2), `images`. |
| **Order** | A customer order. | `business_id`, `customer_ref`, `items[]`, `total_bdt`, `status` (new/confirmed/packed/shipped/delivered/cancelled), `source` (messenger/ig/comment/website), `courier` (T2). |
| **Customer / Lead** | A buyer or prospect (full CRM in T3). | `business_id`, `name`, `phone`, `address`, `score` (T3), `source`. |
| **Conversation** | A thread with a customer. | `business_id`, `channel` (messenger/ig_dm/fb_comment/ig_comment), `customer_ref`, `assignee`, `automation_state` (auto/escalated). |
| **Message** | One message in a Conversation. | `conversation_id`, `direction` (in/out), `body`, `sent_at`, `is_automated`. |

---

## 7. Non-Functional Requirements (NFRs)

| NFR | Requirement |
|---|---|
| **Offline capability** | T0 fully offline. T1+ degrade gracefully: queue actions, show clear offline state, never lose user-entered data. Local persistence (e.g., SQLite/MMKV) with a sync engine. |
| **Low-end Android performance** | Must run smoothly on 2–4 GB RAM Android. Keep bundle/JS heap small, lazy-load tier modules, avoid heavy animations, minimise memory and battery use. Cold start should be fast. |
| **Data frugality** | Minimise data usage (image compression, delta sync, cache). Users are on metered prepaid data. |
| **Bengali-first i18n** | Full Bangla localisation including numerals/currency formatting (৳). RTL not required; correct Bangla typography required. Language switch Bangla↔English. |
| **Responsive web parity** | A responsive web build (Expo web) should reach feature parity for core flows so owners can also work from a browser/desktop. |
| **Reliability of sync** | Sync must be idempotent and conflict-aware; no duplicate ledger entries or orders after retries. |
| **Security & isolation** | Strict per-business tenant isolation; server-enforced entitlements and roles; secure storage of Meta tokens and payment references. |
| **Accessibility / simplicity** | Designed for low digital literacy: large tap targets, minimal steps, clear Bangla copy. |

---

## 8. Out of Scope / Assumptions

**Out of scope (now or entirely):**
- Building or hosting customer websites (T2 only *recommends* hosting; templates are future).
- Acting as a payment processor / holding funds (we integrate bKash, Nagad, Rocket, SSLCommerz; we do not settle money).
- Multi-currency (BDT only).
- Tiers 2–4 feature implementation (architecture only, for now).
- WhatsApp/TikTok channels (future consideration; not committed).
- Desktop-native apps (web build covers desktop).

**Assumptions:**
- Users have a smartphone and a Bangladeshi mobile number for OTP.
- Most have an existing Facebook Page and/or Instagram Business account (required for T1 integration).
- COD is the dominant payment model; the order flow must assume COD by default.
- Meta Graph API access and app review are obtainable for FB/IG integration.
- Couriers (Pathao/RedX/Steadfast) expose usable APIs for T2.

---

## 9. Success Metrics

| Category | Metric |
|---|---|
| **Activation** | % of new sign-ups that record their first transaction (T0) and connect a social account (T1) within day 1. |
| **Offline value** | # of transactions recorded offline; successful sync rate on reconnect (target near 100%, zero data loss). |
| **Retention** | Monthly active businesses; 1-month and 3-month retention; subscription renewal rate per tier. |
| **Conversion / upgrade** | T0→T1 upgrade rate; overall tier-up rate over time. |
| **Inbox efficiency (T1)** | Median first-response time; % conversations handled by automated replies vs. escalated. |
| **Order outcomes (T1)** | # orders confirmed via the Order Confirmation System; confirmation-to-cancel ratio. |
| **AI engagement** | % of businesses using Brand Studio (logo/caption/copy) and AI Finance Insights weekly. |
| **Business health surfaced** | % of businesses that view Revenue/Expense/Profit weekly. |
| **Monetisation** | MRR (BDT), ARPU per tier, churn. |
| **Performance** | Crash-free sessions on low-end Android; cold-start time; data used per session. |

---

*End of PRD.*
