# LensFlow — Next.js + PostgreSQL (Netlify-ready migration of the Flask store)

Full-stack e-commerce: storefront, customer accounts, admin panel, Stripe payments.
Design and feature set migrated 1:1 from `../lensflow-app` (Flask + SQLite).

## Stack

Next.js 14 (App Router, TypeScript) · Auth.js v5 (credentials + JWT sessions, bcryptjs) ·
PostgreSQL via `postgres` driver (Neon recommended) · Stripe Checkout (server-side) ·
DemoPay test rail when Stripe keys are absent · Netlify native Next.js runtime.

## Setup

```bash
npm install
cp .env.example .env   # fill DATABASE_URL + AUTH_SECRET (openssl rand -base64 32)
npm run db:migrate      # creates all tables (proper FKs, indexes, constraints)
npm run db:seed         # catalog, reviews, posts, SAVE10 coupon, admin user
# ...or import the old SQLite store instead of seeding:
SQLITE_PATH=../lensflow-app/store.db npm run db:import
npm run dev             # http://localhost:3000
```

Seed admin: `ADMIN_EMAIL` / `ADMIN_PASSWORD` (defaults `admin@lensflow.shop` / `admin123`).

## Tests

```bash
npm run test:e2e   # Playwright suite: 32 browser checks (needs BASE_URL + test DB)
```
The suite registers, shops, checks out, pays, tops up, subscribes, tickets,
reviews, exercises the full admin panel, dark mode and maintenance mode.

## Deploy to Netlify

1. Push to Git, **New site from Git**, build command `npm run build`, publish `.next`
   (`netlify.toml` already sets this + `NODE_VERSION=22`).
2. Environment variables: `DATABASE_URL` (Neon, pooled, `?sslmode=require`),
   `AUTH_SECRET`, `AUTH_TRUST_HOST=true`, `NEXT_PUBLIC_SITE_URL=https://your-site.netlify.app`,
   Stripe keys when ready.
3. Run `npm run db:migrate` + `npm run db:seed` once against the production database
   (locally with the production `DATABASE_URL`), or `db:import` to carry data over.

## Payments

- **No Stripe keys** → DemoPay test rail (explicitly labelled, no real money).
- **With `STRIPE_SECRET_KEY`** → card payments via Stripe Checkout; set
  `STRIPE_WEBHOOK_SECRET` and point `POST /api/stripe/webhook` at it. Secrets stay
  server-side; the browser only ever sees the publishable key.

## Notes & honest limits

- Sessions are JWT (stateless) — no server restart logout tracking; 30-day expiry.
- Subscription billing is record-level (subscribe/cancel + renew dates), same as the
  Flask version; Stripe Billing for recurring charges is not wired.
- No email sending (no password reset flow); no 2FA/Discord login (as in the source app).
- `npm run build` needs no live database: all data pages are `force-dynamic` and the
  layout degrades to a clear error card if `DATABASE_URL` is missing.
