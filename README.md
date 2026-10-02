# Kestrel Capital FX

A forex brokerage platform: marketing site, client dashboard, live OANDA
account data, a configurable trading bot, and a wallet/KYC flow.

**Stack:** Next.js 14 (App Router) + TypeScript, Tailwind CSS, Prisma
(SQLite in dev, swap for Postgres in prod), NextAuth (credentials + JWT).

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run db:push              # creates prisma/dev.db from schema.prisma
npm run dev                  # http://localhost:3000
```

### Environment variables (`.env.local`)

| Variable | What it's for |
|---|---|
| `DATABASE_URL` | Defaults to local SQLite (`file:./dev.db`). Point at Postgres for production. |
| `NEXTAUTH_SECRET` | Random string for session signing — generate with `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | Your site's base URL (`http://localhost:3000` locally). |
| `OANDA_API_TOKEN` | From your OANDA account: **Manage API Access → Generate Token**. One token serves all clients — each client's own OANDA account ID is entered per-user at `/dashboard/settings`. |

Sign up at [OANDA's practice environment](https://www.oanda.com/) to get a
free demo account + API token to develop against before touching a live
account.

## What's actually wired up vs. what's a placeholder

**Real:**
- Auth (register/login, bcrypt-hashed passwords, JWT sessions)
- Live OANDA data: account balance/equity, open trades, candles
  (`lib/oanda.ts`, `/api/oanda/*`)
- The trading bot (`lib/bot-engine.ts`) is a genuine moving-average
  crossover strategy that places real market orders against whichever
  OANDA environment (practice/live) the user has connected. It's **off by
  default** and manually triggered from `/dashboard/bot` in this build —
  for production, call `runBotForUser()` from a scheduled job (Vercel Cron,
  a cron-triggered API call, etc.) at whatever interval fits your
  strategy's timeframe.

**Placeholders you need to finish before handling real clients:**
- **Payments** (`lib/payments/provider.ts`): deposit/withdrawal requests
  only ever create a `PENDING` database row right now. Handling real client
  money requires a licensed payment processor or banking partner,
  segregated client-account arrangements, and — depending on your
  jurisdiction — money-transmission licensing. That's a legal/compliance
  integration, not something that can be scaffolded generically. Implement
  `PaymentProvider` with your real processor once you have one, and gate
  it behind proper compliance review.
- **KYC** (`/dashboard/kyc`, `/api/kyc`): currently a manual-review upload
  flow — documents are saved to local disk under `/uploads` (dev only; most
  hosts including Vercel don't offer persistent disk, so swap in S3/R2/etc.
  for prod) and an admin would need to approve/reject by hand (there's no
  admin UI here yet — flip `KycSubmission.status` directly via
  `npm run db:studio` for now, or build one). For real clients, use a
  proper identity-verification vendor (Sumsub, Onfido, Persona, etc.)
  instead of manual document review.
- There's no admin UI at all yet — reviewing KYC submissions and wallet
  requests both currently require going into `npm run db:studio` and
  updating rows by hand.

## Admin back-office

`/admin` is now a full back-office with role-based access control — nobody,
not even a Super Admin, needs a database GUI or the command line for
day-to-day operation. Roles:

- **Super Admin** — everything, including creating other staff accounts.
  Meant for the founder(s) only.
- **Compliance** — reviews KYC submissions, sets account standing
  (soft-ban / hard-ban / freeze funds).
- **Finance** — reviews flagged deposit/withdrawal requests, edits global
  risk limits and per-client overrides.
- **Support** — read-only access to the user directory (for answering
  "what's my account status" type questions without touching money or
  compliance decisions).

No single account can do everything except Super Admin — see
`lib/permissions.ts` for the exact permission map, and don't loosen it
casually; that separation is there specifically so one compromised or
rogue staff account can't move money *and* clear its own compliance
flags *and* cover its tracks.

### Autonomous by default

Deposits and withdrawals don't wait on a human unless something's
unusual. Every request runs through the risk engine
(`lib/risk-engine.ts`) the instant it's submitted:

- Under the daily limit and below the high-value alarm tier → **auto-approved
  and completed immediately**, no admin involved.
- Over a limit, or at/above the high-value tier → **routed to the Finance
  queue** (`/admin/wallet`) with the specific reason attached.

Limits are editable at `/admin/settings` (global) or per-client on their
user page (override). Every automatic decision is written to the audit
log with `System` as the actor, so you can always see what the engine did
and why.

There's also an automated 48-hour KYC sweep
(`POST /api/cron/soft-ban-incomplete-kyc`) that soft-bans accounts that
never finished verification — see that file for how to schedule it (it's
not something a browser session can trigger; you point an external
scheduler at it with a shared secret).

### Account standing

Three tiers, matching how you'd actually want to handle a compliance
issue:
- **Soft ban** — trading and withdrawals disabled; the person can still
  log in and see their account.
- **Hard ban** — rejected at login entirely.
- **Fund freeze** — independent of ban status; blocks all deposits and
  withdrawals while an investigation is open.

All three are set from a user's `/admin/users/[id]` page and require a
reason, which is written to the audit log.

### Audit log

`/admin/audit-log` shows every admin action and every automated decision,
newest first. It's append-only by design — there is no update or delete
route for it anywhere in the app, on purpose, so it stays trustworthy
even if a staff account is compromised.

### Making the first Super Admin

Registering an account at `/register` always creates a regular `CLIENT`.
Promoting the *first* Super Admin is the one step that still needs the
command line — after that, everything else happens in the browser,
including creating more staff accounts of any role:

```bash
npm run make-admin -- someone@example.com
npm run make-admin -- someone-else@example.com COMPLIANCE
```

Role defaults to `SUPER_ADMIN` if you omit it. Valid roles: `SUPER_ADMIN`,
`COMPLIANCE`, `FINANCE`, `SUPPORT`. The user must already be registered.

## Compliance note

This is a software scaffold, not legal advice. A platform that takes
client deposits and trades on their behalf is regulated in essentially
every jurisdiction — before accepting a single real deposit, get advice
from a lawyer familiar with forex/brokerage regulation in wherever you and
your clients are based, and complete whatever registration that requires.
The risk-disclosure section on the landing page (`app/page.tsx`) has a
placeholder for your registration number — fill it in once you're actually
licensed, and don't launch to real clients before then.

## Project structure

```
app/                     Routes (App Router)
  page.tsx                 Marketing landing page
  login/, register/        Auth pages
  dashboard/                Protected client area (layout.tsx guards it)
    page.tsx                 Overview — live OANDA balance/positions
    bot/                      Bot controls + activity log
    wallet/                   Deposit/withdrawal requests + history
    kyc/                      Identity verification upload
    history/                  Full trade + transaction history
    settings/                 Connect a broker account
  api/                      Route handlers (all return JSON)
lib/
  oanda.ts                  OANDA v20 REST API client
  bot-engine.ts              The moving-average crossover strategy
  auth.ts                    NextAuth config
  payments/provider.ts       Pluggable payment provider interface (mock)
  prisma.ts                  Prisma client singleton
prisma/schema.prisma        Data model
middleware.ts                Route protection for /dashboard and API routes
```

## Design

Visual identity is a deliberate "instrument panel" look — deep ink-navy
background, a brass/gold accent (not the generic dark+neon-green fintech
default), Space Grotesk for display type, IBM Plex Mono for all numeric
data (prices, balances, timestamps) so figures read the way they would on
a real trading terminal. The scrolling ticker tape in the header is the
one signature motion element, used consistently across marketing and
dashboard.
