# Simple Lens — Next.js + PostgreSQL open-source commerce

Full-stack e-commerce: storefront, customer accounts, admin panel, flexible payments.
Backend: self-contained Next.js + PostgreSQL (your own open-source code — no licence
fee, no mandatory SaaS). See `docs/backend-selection.md` for the 2026 research that
chose it over Medusa / Vendure / Saleor / Spree for this small independent store.

## Stack

Next.js 14 (App Router, TypeScript) · Auth.js v5 (credentials + JWT sessions, bcryptjs) ·
PostgreSQL via `postgres` driver (Neon recommended, or local Docker) ·
Stripe Checkout (server-side) + DemoPay test rail + store balance +
**Cash on Delivery** · Netlify/Vercel-ready.

```
Browser (React) → lib/api.ts → Next.js Route Handlers (/api/*) + Server Actions
→ PostgreSQL (products, variants, images, carts, orders, users, addresses…) 
→ Payments: Stripe / DemoPay / COD / balance (+ CMI stub for Morocco)
```

## Setup

```bash
npm install
cp .env.example .env   # fill DATABASE_URL + AUTH_SECRET (openssl rand -base64 32)

# Option A — local Postgres via Docker (no cloud account needed):
docker compose up -d db
# DATABASE_URL=postgresql://lensflow:lensflow@localhost:5432/lensflow

# Option B — Neon free tier: https://neon.tech (pooled URL, ?sslmode=require)

npm run db:migrate      # creates all tables (idempotent; safe to re-run)
npm run db:seed         # catalog, variants, gallery images, shipping methods,
                        # reviews, posts, SAVE10 coupon, admin user
                        # (re-runnable: backfills shop extensions on existing DBs)
# ...or import the old SQLite store instead of seeding:
SQLITE_PATH=../lensflow-app/store.db npm run db:import
npm run dev             # http://localhost:3000
```

Seed admin: `ADMIN_EMAIL` / `ADMIN_PASSWORD` (defaults `admin@lensflow.shop` / `admin123`).
Fresh installs start with an EMPTY catalog (no products, no fake reviews/orders) — add real products at `/admin/products`.

## What the store does (all real, backend-connected)

- **Shop:** homepage, `/products` (categories, search, price/stock filters, sort,
  pagination), `/product/:slug` (real variant options with per-variant
  price/stock, multi-image gallery, reviews), search modal (`/api/search`).
- **Cart:** server-side carts in Postgres (anonymous cookie token, merged on
  login), drawer + `/cart`, quantity updates, remove, coupon, variant-aware
  pricing, stock caps — all via `POST /api/cart`.
- **Checkout:** contact email, shipping address (or saved `/account/addresses`),
  shipping-method radio (admin-managed `shipping_methods`), payment radio
  (`lib/payments.ts` registry: COD / balance / Stripe / DemoPay / CMI-stub),
  coupon, live totals. Server re-validates everything; never trusts the browser.
- **Orders:** snapshot of items + address + shipping + payment on `orders`;
  `/checkout/success`, `/pay/:code`, `/account/orders/:code` detail,
  `/api/order/:code` status endpoint.
- **Accounts:** register/login/logout (Auth.js credentials, bcrypt), profile,
  saved addresses, order history + details, balance top-ups, tickets, reviews.
- **Admin (`/admin`):** dashboard, products (+ variants + gallery images),
  categories, shipping methods, payments status, coupons, orders (ship/pay
  columns, status lifecycle incl. COD pending→paid/completed), customers,
  reviews, tickets, payouts, resellers, blog, design, settings.

## API layer

Browser code talks to the backend only through `lib/api.ts`
(`products`, `product`, `cart`, `cartOp`, `search`, `shipping`, `myOrders`)
over real endpoints: `/api/products`, `/api/products/:slug`, `/api/cart`,
`/api/search`, `/api/shipping`, `/api/orders`, `/api/order/:code`.

## Tests

```bash
npx tsc --noEmit        # typecheck
npm run build           # production build
npm run test:e2e        # Playwright suite (needs BASE_URL + test DB)
```
The suite registers, shops, checks out, pays, tops up, subscribes, tickets,
reviews, exercises the full admin panel, dark mode and maintenance mode.

## Deploy

**Frontend + backend (one unit):** Netlify or Vercel.
1. Push to Git, **New site from Git**, build `npm run build`
   (`netlify.toml` already sets this + `NODE_VERSION=22`).
2. Env vars: `DATABASE_URL` (Neon pooled, `?sslmode=require`), `AUTH_SECRET`,
   `AUTH_TRUST_HOST=true`, `NEXT_PUBLIC_SITE_URL=https://your-site…`,
   Stripe keys when ready.
3. Run `npm run db:migrate` + `npm run db:seed` once against the production DB
   (locally with the production `DATABASE_URL`), or `db:import` to carry data over.

**Database:** Neon free tier (recommended) or any Postgres 14+.
**Storage:** product images are URLs (Unsplash samples by default; paste any link
in admin). No object-storage account required.
**Payments:** see below. Backend and DB communicate over `DATABASE_URL`;
frontend→backend over same-origin `/api/*` + Server Actions (no CORS setup).

## Payments

- **Cash on Delivery** — always available, no credentials. Orders stay `pending`
  until delivery; admin marks `paid`/`completed`. Ideal for Morocco.
- **No Stripe keys** → DemoPay test rail (explicitly labelled, no real money).
- **With `STRIPE_SECRET_KEY`** → card payments via Stripe Checkout; set
  `STRIPE_WEBHOOK_SECRET` and point `POST /api/stripe/webhook` at it. Secrets stay
  server-side; the browser only ever sees the publishable key.
- **CMI (Morocco)** — stubbed: checkout hides it until `CMI_MERCHANT_ID` +
  `CMI_SECRET_KEY` are set AND `lib/cmi.ts` redirect/callback is implemented.
  Add providers in `lib/payments.ts` without rewriting checkout.

## Notes & honest limits

- Sessions are JWT (stateless) — no server restart logout tracking; 30-day expiry.
- Subscription billing is record-level (subscribe/cancel + renew dates), same as the
  Flask version; Stripe Billing for recurring charges is not wired.
- No email sending until `RESEND_API_KEY` (+ `EMAIL_FROM`) is set; password-reset and order emails log to the server console instead.
- Prices are stored in MAD cents; COD is collected in cash at delivery.
- `npm run build` needs no live database: all data pages are `force-dynamic` and the
  layout degrades to a clear error card if `DATABASE_URL` is missing.
