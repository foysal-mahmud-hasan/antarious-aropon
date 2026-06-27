# Aropon — User Journeys (Tier 0 & Tier 1)

> **Audience:** AI-onboarding artifact. Read this with `prd.md` to understand how a Bangladeshi MSME owner actually moves through Aropon. These journeys cover the **MVP tiers (T0 + T1)** in detail, including edge cases. See `prd.md` for product/tier definitions.

**Personas used below:**
- **Rима (রিমা)** — owns "Rima's Closet", a home-based women's clothing brand. Sells on a Facebook Page + Instagram. Low-end Android, patchy data, Bangla-first. Pays via bKash.
- **Sajib** — Rima's part-time **staff** who handles Instagram DMs.

---

## 0. Cross-cutting conventions

- Default language: **Bangla**. Money shown as **৳ (BDT)**.
- Connectivity can drop at any step; the app shows a persistent **offline banner** ("অফলাইন — পরিবর্তন সেভ হচ্ছে") and queues actions.
- Entitlements are **server-enforced**: locked features show a lock + upgrade prompt.

---

## 1. Onboarding & Signup (Phone-OTP)

**Goal:** Rima creates an account and her first Business.

1. Rima installs **Aropon** from Play Store and opens it.
2. Splash → language pick: **বাংলা** (default) / English. She keeps Bangla.
3. Welcome carousel (3 cards) explains: bookkeeping, social inbox, AI branding. She taps **শুরু করুন (Get Started)**.
4. **Phone entry:** she types her number `01XXXXXXXXX`. App validates it's a valid BD mobile number.
5. App sends an **OTP via SMS**. Screen shows a 4–6 digit input with auto-read (Android SMS Retriever).
6. Rima enters the OTP → server verifies → **User** account created/authenticated. Session token issued.
7. **Profile:** she enters her name (রিমা).
8. **Create Business:** she enters business name "Rima's Closet". A **Business (Organization)** is created; she becomes its **Owner** via a **Membership** (role = owner).
9. App lands on the **tier selection** screen (Section 2).

### Edge cases
- **No connectivity at OTP:** OTP can't be sent. App shows "ইন্টারনেট সংযোগ নেই" and a **Retry**. Signup itself requires connectivity (one-time); this is acceptable. After this, T0 works offline.
- **OTP not received:** "Resend OTP" enabled after a 30–60s countdown; fallback to a second attempt; rate-limited server-side.
- **Wrong OTP:** inline error, limited retries, then cool-down to prevent brute force.
- **Returning user:** entering a known number → OTP → lands directly in their Business (or business-picker if they own several).

---

## 2. Tier Selection & Subscription

**Goal:** Rima picks a plan for "Rima's Closet".

1. Tier screen lists plans with Bangla descriptions and BDT pricing:
   - **Offline Mode — ৳200/মাস** (bookkeeping + Brand Studio).
   - **Social Commerce — ৳700–800/মাস** (FB/IG inbox, orders, finance, AI).
   - T2–T4 shown but marked "শীঘ্রই / উচ্চতর প্ল্যান".
2. Rima starts with **Offline Mode (T0)** to try cheaply.
3. **Payment:** she chooses **bKash** (also Nagad/Rocket/SSLCommerz available). Completes payment in the MFS flow.
4. Server records a **Subscription** (business_id, tier=0, status=active, renewal_date, payment_method=bKash) and grants **T0 entitlements**.
5. App unlocks T0 modules: **Finance (bookkeeping)** + **Brand Studio**. T1+ features remain locked (lock icon).

### Edge cases
- **Declined / failed payment:** MFS returns failure → app shows "পেমেন্ট ব্যর্থ হয়েছে" with **Retry** and "Try another method". No entitlement granted; Subscription stays `pending/none`. Rima can still explore but T0 features stay locked until payment clears (or a free-trial/grace policy applies if configured).
- **Payment success but webhook delayed:** app shows "পেমেন্ট যাচাই হচ্ছে…"; entitlement activates when the server confirms. Client polls/receives push; never unlocks on client claim alone.
- **Upgrade later (T0→T1):** Rima can upgrade from Settings → Subscription; pays the difference/new price; server grants T1 entitlements; locked modules light up without reinstall.

---

## 3. Tier 0 — Daily Bookkeeping While Offline + Sync on Reconnect

**Goal:** Rima records the day's cash-in/out at a market with no data, then syncs at home.

### Recording offline
1. Rima is at a wholesale market in Islampur; mobile data is dead. App shows the **offline banner**.
2. She opens **Finance → হিসাব (Bookkeeping)**.
3. **Add revenue:** taps **+ আয় (Income)** → amount `৳1,200`, category "Sale", note "3 kurti". Saves.
4. **Add expense:** taps **+ খরচ (Expense)** → amount `৳4,500`, category "Stock purchase", note "fabric". Saves.
5. Each save writes a **Transaction** to **local storage** (append-only, `sync_state = pending`). The running **profit** (Income − Expense) updates **instantly, locally** — no network needed.
6. She adds several more entries through the day. All stored locally.

### Sync on reconnect
7. At home, Wi-Fi returns. App detects connectivity, banner switches to "সিঙ্ক হচ্ছে…".
8. The **sync engine** uploads pending Transactions in order. Server assigns canonical IDs; entries are **idempotent** (a client-generated UUID prevents duplicates on retry).
9. Banner clears; each entry shows a **synced** check. Totals match local totals (zero data loss).

### Edge cases
- **App killed before sync:** local data persists (durable storage). On next launch + connectivity, pending entries sync.
- **Partial sync / connection drops mid-upload:** uploaded entries are marked synced; the rest stay `pending` and retry. Idempotency keys prevent doubles.
- **Sync conflict:** because the ledger is **append-only**, two devices/edits don't overwrite — both transactions are kept. For an *edited* entry, resolution is **last-write-wins per field** with an audit trail; the user is shown the result if it materially changes a total.
- **Clock skew (offline device):** server stores `occurred_at` from the device plus a server `received_at`; reporting uses a consistent rule so offline-dated entries land on the correct day.

---

## 4. Tier 0 — Brand Studio (Logo / Caption / Copywriting)

**Goal:** Rima creates branding assets for a new product post.

### AI Logo support
1. Finance is set up; Rima opens **Brand Studio → লোগো (Logo)**.
2. She enters brand name "Rima's Closet", picks a vibe (elegant/feminine), color preference.
3. App generates **logo options**. She picks one, tweaks, and **saves it to the Business** (used across the app/posts).

### AI Caption generation
4. She opens **ক্যাপশন (Caption)**, uploads/selects a product photo (a kurti), adds a hint ("Eid collection, ৳1,200, limited").
5. App generates **Bangla captions** (with optional English). She picks one, edits a word, copies it.

### AI Copywriting
6. She opens **কপিরাইটিং (Copywriting)** for a product description; enters product details.
7. App generates Bangla promo copy (features + call-to-action like "ইনবক্সে অর্ডার করুন"). She copies it for her Facebook post.

### Edge cases
- **Offline AI:** If generation can run on-device, it works offline. If it cannot, the request is **queued** with "ইন্টারনেট এলে তৈরি হবে" and fulfilled on reconnect. **Bookkeeping is never blocked** by this.
- **Poor result / wants variety:** "আবার তৈরি করুন (Regenerate)" produces new options.
- **Generation failure on reconnect:** queued request retries; on repeated failure, a clear error + manual retry. No silent loss.

---

## 5. Tier 1 — Connecting Facebook & Instagram

**Goal:** Rima upgrades to T1 and connects her social accounts.

1. Rima upgrades to **Social Commerce (T1)** (Section 2 upgrade flow). Server grants T1 entitlements; **Integrations, Inbox, Orders, Calendar, AI Assistant** unlock.
2. **Integrations → Facebook:** she taps **Connect Facebook**. OAuth opens; she logs into Facebook, grants permissions for her **Page** (Messenger + comments) via Meta Graph API.
3. App stores the **Page access token** securely (server-side) against the Business. Connection shows **Connected ✓**.
4. **Integrations → Instagram:** she connects her **Instagram Business/Creator** account (linked to the Page) for DMs + comments.
5. Aropon begins ingesting Messenger threads, IG DMs, and post comments into the **Unified Inbox**.

### Edge cases
- **Failed FB token / expired token:** if Meta returns an invalid/expired token (revoked permission, password change), the Integration card shows **"সংযোগ বিচ্ছিন্ন — আবার যুক্ত করুন"** (Disconnected — reconnect). Inbox shows a banner that new messages can't sync until reconnected. Rima taps **Reconnect** → re-does OAuth → token refreshed. No messages are lost server-side once reconnected.
- **IG not linked to a Page:** app explains the Meta requirement (IG must be a Business account linked to the FB Page) with a help step.
- **Permission partially granted:** app detects missing scopes and prompts to grant them again.
- **Offline during connect:** OAuth requires connectivity; app asks her to retry when online.

---

## 6. Tier 1 — Unified Inbox Reply (Automated + Manual Escalation)

**Goal:** Handle incoming customer messages efficiently across channels.

### Automated reply
1. A customer messages the Page: "এই কুর্তিটার দাম কত?" (What's the price of this kurti?).
2. The message lands in the **Unified Inbox** as a **Conversation** (channel = messenger). 
3. An **Automated Reply** rule/AI recognises a price/availability question and instantly replies in Bangla with price + "ইনবক্সে অর্ডার করতে নাম, ঠিকানা, ফোন দিন।" (`automation_state = auto`, message `is_automated = true`).
4. Many simple queries are resolved without Rima touching the phone, improving response time.

### Manual escalation
5. A different customer asks something the bot can't handle: "আপনারা কি কাস্টম সাইজ বানান?" (Do you make custom sizes?).
6. Automation can't confidently answer → it **escalates**: `automation_state = escalated`, conversation flagged **needs human**, optional notification to Rima.
7. Rima (or **staff Sajib**, per his role) opens the conversation and **manually replies**. She can also **manually escalate/take over** any auto conversation by tapping **নিজে উত্তর দিন (Reply myself)**, which pauses automation for that thread.
8. **Comments:** the same inbox surfaces **Facebook/Instagram post comments**; Rima replies or hides as needed.

### Edge cases
- **Both auto and human reply race:** once a thread is escalated/taken over, automation is suppressed to avoid double replies.
- **Staff permissions:** Sajib (staff) sees only assigned/IG conversations and cannot see finance totals.
- **Offline:** Rima's manual reply is queued and sent on reconnect; the thread shows "পাঠানো হচ্ছে…".
- **Token failure mid-conversation:** see Section 5 — inbox banner prompts reconnect; outgoing replies queue until reconnected.

---

## 7. Tier 1 — Order Confirmation

**Goal:** Turn a conversation into a confirmed order (COD-first).

1. In a Messenger thread, the customer commits: "নিব, ঠিকানা: Mirpur 10, ফোন 01XX, ক্যাশ অন ডেলিভারি।"
2. Rima taps **অর্ডার তৈরি করুন (Create Order)** from the conversation. The **Order Confirmation System** opens, pre-filling what it can from the chat.
3. She fills/confirms: items (1 kurti), price `৳1,200`, customer name/phone/address, payment = **COD**.
4. App creates an **Order** (`source = messenger`, `status = new`, total ৳1,200) linked to the Conversation/Customer.
5. App sends a **confirmation message** to the customer in Bangla ("আপনার অর্ডার কনফার্ম — ১টি কুর্তি, ৳১২০০, ক্যাশ অন ডেলিভারি, Mirpur 10।").
6. Order status moves to **confirmed**. (Courier booking + auto stock decrement come in **T2**; in T1 the order is tracked manually.)
7. Optionally, the order's revenue can be recorded to **Finance** on delivery/payment.

### Edge cases
- **Missing details:** if address/phone absent, the form blocks confirmation and prompts to ask the customer.
- **Customer cancels:** Rima sets status = **cancelled**; reflected in order list.
- **Offline:** order is created locally (`pending` sync) and the confirmation message queues; both sync/send on reconnect.
- **Duplicate order:** idempotency + "this conversation already has an order" warning prevents accidental doubles.

---

## 8. Tier 1 — Revenue / Expense / Profit + AI Finance Insight

**Goal:** Rima checks her business health and gets an AI nudge.

1. Rima opens **Finance**. She sees three cards: **আয় (Revenue)**, **খরচ (Expense)**, **লাভ (Profit)** — all in ৳, for the selected period (today/week/month).
2. Numbers aggregate her **Transactions** (including offline-synced ones) plus revenue from confirmed/delivered orders if recorded.
3. She opens **AI Assistant → Finance Insights**. It produces a plain-Bangla insight, e.g.:
   - "এই সপ্তাহে লাভ ৳৮,৪০০ — গত সপ্তাহের চেয়ে ১৫% বেশি। সবচেয়ে বড় খরচ: ফেব্রিক।"
4. **Business Performance Suggestions** adds actionable nudges, e.g.: "মঙ্গলবার বিক্রি কম — ঐ দিনে অফার দিন।" / "ইনস্টাগ্রাম DM-এ গড় উত্তর সময় বেশি — দ্রুত উত্তর দিন।"

### Edge cases
- **Not enough data:** with too few transactions, the AI says it needs more entries rather than inventing trends.
- **Offline:** finance cards still compute from local data; the **AI insight** (if cloud-based) queues and shows "ইন্টারনেট এলে বিশ্লেষণ আসবে".
- **Role gating:** staff don't see profit totals; owner/manager do.

---

## 9. Tier 1 — Calendar Usage (Daily / Weekly)

**Goal:** Rima organises follow-ups and deliveries.

1. Rima opens **Calendar**. Defaults to **Daily (দৈনিক)** view: today's items — confirmed orders to dispatch, follow-ups, restock reminders.
2. She switches to **Weekly (সাপ্তাহিক)** to see the week's load (e.g., Eid-week order spike).
3. She adds a manual task ("Sundarban courier pickup 4pm") and a follow-up ("call Mirpur customer").
4. Confirmed orders and follow-ups from conversations can appear on the relevant day, so nothing is dropped.

### Edge cases
- **Offline:** calendar entries are local and sync later.
- **Timezone:** all times in Asia/Dhaka (BST).

---

## 10. Connectivity & Failure Quick-Reference

| Situation | App behaviour |
|---|---|
| **No connectivity (T0)** | Full bookkeeping + (on-device) Brand Studio work; offline banner; changes queue. |
| **No connectivity (T1)** | Read cached inbox/orders/finance; new replies/orders/insights queue; clear "sending/saving" states. |
| **Sync conflict** | Append-only ledger avoids overwrite; edited records use last-write-wins per field + audit; user shown if a total changes. |
| **Failed FB/IG token** | Integration card shows "disconnected — reconnect"; inbox banner; reconnect via OAuth; no server-side message loss. |
| **Declined payment** | "পেমেন্ট ব্যর্থ" + retry / alternate method (bKash/Nagad/Rocket/SSLCommerz); entitlement not granted; server is source of truth. |
| **Delayed payment webhook** | "verifying payment…"; unlock only on server confirmation. |
| **App killed mid-task** | Local data durable; pending items sync on next online launch; idempotency prevents duplicates. |

---

*End of User Journeys.*
