# Testing Guide

How to test Aropon (T0 + T1) — for manual testers and for running the automated suite.

## A. Manual testing (testers)

Open the app URL in any browser (mobile or desktop). The phone browser shows the mobile UI; desktop
shows the sidebar layout.

### Logging in — two ways
1. **Tap a tier (fastest):** under "ডেমো হিসেবে চেষ্টা করুন", tap **টায়ার ০ ডেমো** or **টায়ার ১ ডেমো** →
   the OTP screen shows with the code already filled → tap **এগিয়ে যান**. You land in a **brand-new,
   private workspace** pre-filled with sample data. Every tap = a fresh clean slate; testers never
   collide with each other.
2. **Your own number:** type a BD number (e.g. `+88017XXXXXXXX`), tap **কোড পাঠান** → the code is
   pre-filled (test mode) → **এগিয়ে যান**. This is a **persistent private** workspace — come back to
   the same number to resume it.

> In **Settings → 🧹 ডেটা রিসেট**, "Reset my data" wipes your workspace back to clean.
> In **Settings → প্যাকেজ (টেস্ট)**, switch **T0 ↔ T1** to compare tiers in one account.

### What to verify — Tier 0 (Offline Mode)
- **হিসাব:** balance hero card shows; add an income/expense (type, amount, category, note) → it
  appears in history and the balance/income/expense/profit update immediately and persist on refresh.
- **Gating:** অর্ডার / বার্তা / ক্যালেন্ডার show a "locked — upgrade to T1" state.

### What to verify — Tier 1 (Social Commerce)
- **অর্ডার:** create an order (customer, channel, product, qty, price) → appears in the list; tap
  **নিশ্চিত করুন** → status → confirmed; toggle payment due/paid; cancel.
- **বার্তা (inbox):** demo FB/IG conversations are listed; open one → reply, **অটো-রিপ্লাই** (rule-based
  Bengali reply), **এস্কেলেট** (status → escalated); filter সব/ওপেন/এস্কেলেটেড.
- **ক্যালেন্ডার:** আজ/সপ্তাহ toggle groups orders + transactions by day.
- **হিসাব:** revenue/expense/profit tracking (same as T0 plus full).

> On hold (not built): Brand Studio, AI Finance Insights / Business Performance Suggestions.

## B. Automated tests (developers)

```bash
pnpm run typecheck          # whole workspace
pnpm run test               # unit tests (core, i18n); API integration suite skips w/o a DB

# API integration suite (real Postgres): create a test DB, then:
createdb aropon_vitest      # or: psql -c 'create database aropon_vitest'
TEST_DATABASE_URL=postgres://USER@HOST:5432/aropon_vitest \
  pnpm --filter @aropon/api-server test
```

The integration suite (`services/api/src/integration.test.ts`) auto-migrates the test DB and covers:
demo-login **isolation**, **reset** clean-slate, **T0→T1 gating**, finance add→balance/summary,
orders create→confirm, and inbox seed→auto-reply→escalate.

### End-to-end (web)
`apps/mobile` builds to static web (`pnpm --filter @aropon/mobile export:web`). A headless
puppeteer pass (see repo scripts) logs in via a demo session and asserts each screen renders — used
to verify the design + tier gating before a release.
