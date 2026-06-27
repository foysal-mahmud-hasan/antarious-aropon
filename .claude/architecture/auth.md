# Authentication

> Identity is **Supabase Auth**. **Phone OTP is the primary path** (phone numbers are the dominant identity in Bangladesh); **email** and **Facebook/Google social** are secondary. Sessions are JWT-based; the API verifies the token and resolves the active org. Authorization (who-can-do-what, tier gating) is a separate concern — see `authorization.md`.

## 1. Methods

| Method | When | Notes |
|---|---|---|
| **Phone OTP** | Default sign-in/up | SMS code to `+8801…`; one tap, no password. Primary for BD. |
| **Email** (magic link / password) | Users who prefer email | Secondary |
| **Facebook / Google social** | One-tap social | Facebook also bootstraps the Meta connection for FB/IG inbox later |

All three land in the same `auth.users` record and the same app `users` row (linked by id). A user can attach multiple identities (phone + social) to one account.

## 2. Phone OTP flow (sequence)

```
User            Mobile App            tRPC API (Hono)        Supabase Auth         SMS Gateway
 │  enter phone     │                       │                      │                   │
 │ ───────────────► │                       │                      │                   │
 │                  │  auth.requestOtp       │                      │                   │
 │                  │ ─────────────────────► │  signInWithOtp(phone)│                   │
 │                  │                        │ ───────────────────► │  send code        │
 │                  │                        │                      │ ────────────────► │
 │                  │                        │                      │                   │ ──► SMS to user
 │   enter 6-digit  │                        │                      │                   │
 │ ───────────────► │  auth.verifyOtp        │                      │                   │
 │                  │ ─────────────────────► │  verifyOtp(phone,code)│                  │
 │                  │                        │ ───────────────────► │  validate         │
 │                  │                        │ ◄─────────────────── │  {access,refresh} │
 │                  │                        │  bootstrap account→org (see §6)          │
 │                  │ ◄───────────────────── │  session + isNewUser │                   │
 │   into app       │  store tokens (secure) │                      │                   │
```

- **`auth.requestOtp`** (`{ phone }`) → Supabase `signInWithOtp`. SMS delivered via the configured **Bangladeshi SMS gateway** (Supabase phone provider).
- **`auth.verifyOtp`** (`{ phone, code }`) → Supabase `verifyOtp` returns access + refresh tokens; the server runs **account→org bootstrapping** (§6) and returns `{ accessToken, refreshToken, userId, isNewUser }`.
- Codes are short-lived; resend is **rate-limited via Upstash Redis** (per phone + per IP) to curb SMS abuse/cost.

## 3. Email & social

- **Email:** Supabase magic-link or email+password (`auth.signInWithOtp`/`signInWithPassword`). Same bootstrap on first verify.
- **Social:** Supabase OAuth (`signInWithOAuth`) for Facebook and Google; redirect handled by Expo Router deep link / web callback. **Facebook** scopes requested here are minimal (login only); the broader **Meta Graph** permissions for FB/IG inbox are a separate connect step in the `social` router, not part of login.
- **Identity linking:** a returning user signing in with a new method on the same verified phone/email is linked to the existing account, not duplicated.

## 4. Session & token handling

- **Tokens:** Supabase issues a short-lived **JWT access token** + a long-lived **refresh token**. The access token's `sub` is the user id (= `users.id`).
- **Storage:** tokens are kept in **expo-secure-store** (native Keychain/Keystore) on device; on web, in an httpOnly-style secure cookie via the auth callback. Never in plain AsyncStorage.
- **Refresh:** the Supabase client auto-refreshes the access token using the refresh token; the app listens for `onAuthStateChange` to keep the session live and to clear state on sign-out.
- **API verification:** every tRPC call sends `Authorization: Bearer <access>` and `x-aropon-org: <orgId>`. The Hono middleware **verifies the JWT** (Supabase JWKS), sets `ctx.userId`, then loads the membership/role + entitlements for the requested org into context (`api-spec.md` §3).
- **RLS:** Postgres reads `auth.uid()` from the same JWT, so database policies enforce tenant isolation independently of the app layer (`database-design.md` §3).
- **Offline:** a cached session lets the app open and operate on local SQLite offline; the access token is refreshed on reconnect. If the refresh token is expired/revoked, the app drops to a read-only state and prompts re-auth while preserving unsynced local writes.

## 5. Sign-out & revocation
- Sign-out clears secure-store tokens, calls Supabase `signOut`, and resets client state (TanStack Query cache, Zustand). PowerSync stops and **local org buckets are purged** so the next user on a shared device can't read them.
- Revoking a membership (server) takes effect on next token refresh / sync; RLS and sync rules immediately stop serving that org's rows.

## 6. Account → org bootstrapping

A user is useless without an organization (the tenant). On **first successful verify** (`isNewUser === true`):

1. Create/locate the `users` row (id = `auth.uid()`), default `locale = "bn"`.
2. If the user has **no active membership**, create a **default organization** (`name` from a quick onboarding prompt, `owner_id = user.id`) and an **`owner` membership** linking them.
3. Create a **`subscriptions` row at tier `t0`** ("Offline Mode") for the new org (`subscription-system.md`).
4. Seed nothing else — the app is immediately usable offline.

For **returning** users (`isNewUser === false`):
- Load all active memberships; pick the **last-active org** (persisted client-side) as `x-aropon-org`, else the first membership. The app exposes an **org switcher** to change the active tenant.
- **Invited users:** an invite (a `memberships` row with `status = "invited"`) is accepted on first sign-in with the matching phone/email, converting it to `active` rather than creating a new org.

Bootstrapping runs **server-side inside `auth.verifyOtp`** so the client receives a session that already has a tenant and entitlements resolved — no half-initialized states.
