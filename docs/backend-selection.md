# Backend selection — research notes (September 2026)

Goal: a genuinely free/open-source ecommerce backend for a small independent
store (phone lenses, Morocco-friendly payments incl. Cash on Delivery),
with a production Next.js + TypeScript storefront.

Sources checked: official docs, GitHub repos, pricing/license pages,
deployment guides, payment-provider docs (Sept 2026).

## Candidates

### Medusa v2 (Node.js + TypeScript)
- Website: https://medusajs.com — GitHub: https://github.com/medusajs/medusa
- License: **MIT** (permissive, commercial use OK, no GMV tax).
- Cost: software free; optional Medusa Cloud from ~$29/mo. Self-host needs a
  **Node server + worker, PostgreSQL + Redis** (Meilisearch optional).
  Realistic self-host ≈ $35–106/mo (guides, 2026).
- Functions: products, variants, collections, images, inventory, pricing,
  promotions, customers, carts, orders, shipping, taxes, refunds, webhooks,
  admin dashboard, search. Full commerce engine.
- DX: REST + JS SDK, Next.js starter, TypeScript-first, plugin/module system.
- Payments: Stripe plugin, manual-payment + COD community plugins, custom
  providers possible. No native Moroccan CMI — custom module required.
- Maintenance: very active (v2 launched 2024, steady 2025–2026 releases).
- Tradeoffs: **heaviest ops burden** — needs always-on server/worker/Redis,
  cannot run on Vercel/Netlify serverless alone; v1→v2 upgrades were breaking;
  overkill for a 6-product store.

### Vendure (Node.js + TypeScript, GraphQL)
- Website: https://vendure.io — GitHub: https://github.com/vendurehq/vendure
- License: **GPLv3 core** (free to self-host; copyleft — derivatives shared
  under GPL; commercial licence with indemnification available via Platform).
- Cost: software free; Platform subscription quoted per project (support/SLAs).
- Functions: catalog, variants, pricing, promotions, customers, orders,
  shipping, taxes, admin UI (Angular). Full engine.
- DX: TypeScript-first, excellent GraphQL API, custom PaymentMethodHandlers.
- Payments: Stripe plugin, pay-on-delivery / manual handlers, custom handlers
  (CMI would be a custom handler). Flexible.
- Tradeoffs: **GPLv3 copyleft** is a restriction some merchants prefer to
  avoid; still needs a long-running Node server; smaller ecosystem than Medusa.

### Saleor (Python/Django + GraphQL)
- Website: https://saleor.io — Docs: https://docs.saleor.io — GitHub: saleor/saleor
- License: **BSD-3-Clause** (permissive, OSI-approved, commercial use OK).
- Cost: core free; optional Saleor Cloud from ~$159/mo. Self-host needs
  **Python API + worker, PostgreSQL + Redis** (~$10–25/mo infra).
- Functions: multi-channel catalog, variants, warehouses, promotions,
  customers, checkout, payments apps, webhooks, dashboard. Enterprise-grade.
- DX: GraphQL-first, good docs; but **Python backend** — weaker fit for a
  TypeScript/React team and for this existing Next.js codebase.
- Payments: Stripe/Adyen apps, manual, extensible via apps. CMI = custom app.
- Tradeoffs: most powerful for scale, but most complex for a small store and
  the worst stack fit here.

### Spree Commerce (Ruby on Rails)
- Website: https://spreecommerce.org — GitHub: spree/spree
- License: **moved BSD → AGPL-3.0 (2026)** + commercial options.
  AGPL is strong copyleft (network-use triggers source-sharing duties).
- Functions: complete marketplace (vendors, commissions, payouts), API, admin.
- Tradeoffs: **AGPL restriction + Ruby stack** — poor fit for Next.js/TS,
  and licensing is the most restrictive of the shortlist.

### Sylius (PHP/Symfony), WooCommerce (PHP/WordPress, GPL)
- Both genuinely open-source and proven, with COD/manual payments and (for
  WooCommerce) existing Moroccan CMI plugins.
- Tradeoffs: **PHP stacks** — API integration into a Next.js/TS storefront is
  clunkier (REST/WooGraphQL), WordPress brings a larger security/maintenance
  surface, and neither matches the existing codebase.

## Decision

**Selected: self-contained open-source backend already in this repo —
Next.js Route Handlers + Server Actions + PostgreSQL ("LensFlow core").**

Why it wins for *this* project:
1. **Licensing/cost:** your own code — no licence fee, no GMV cut, no copyleft
   (unlike GPLv3/AGPL), no mandatory SaaS. Only infra: Postgres (Neon free
   tier or local Docker) — no Redis/worker/Meili required.
2. **Functionality:** covers everything a small store needs — products,
   **real variants** (`product_variants`), **galleries** (`product_images`),
   categories, inventory (incl. per-variant stock), pricing + compare-at,
   coupons, customers + Auth.js credentials auth (bcrypt), server-side carts,
   checkout with **addresses + shipping methods + payment selection**,
   orders with status lifecycle + refunds (admin), Stripe + DemoPay + balance
   + **Cash on Delivery**, webhooks (`/api/stripe/webhook`), admin dashboard,
   search/filter/sort/pagination, USD pricing with Morocco-ready COD.
3. **Frontend integration:** same TypeScript/React/Next.js codebase — no
   network boundary to operate, typed `lib/api.ts` client over real REST
   endpoints (`/api/products`, `/api/cart`, `/api/search`, `/api/shipping`,
   `/api/orders`, `/api/order/:code`).
4. **Ops:** one deployable (Netlify/Vercel) + managed Postgres. Medusa/Vendure/
   Saleor would each add a second always-on backend to host, monitor, and
   upgrade — unjustified for this catalog size.
5. **Payments/Morocco:** COD works today with zero credentials; Stripe is a
   clean env-flag swap; `lib/payments.ts` registry + `orders.payment_method`
   means CMI/PayZone can be added without rewriting checkout (stub + exact
   env vars documented).

Honest tradeoffs vs. the platforms:
- No plugin marketplace, no multi-warehouse/multi-channel, no hosted support
  team — you own the code and the upgrades (mitigated: small surface, plain
  SQL migrations, `npm run db:migrate`).
- Scales to small/medium catalogs; a future migration to Medusa/Vendure stays
  possible because the storefront talks to the backend through `lib/api.ts`
  and REST — the seam is clean.

Verdict: for a small independent store that must be free, self-hostable,
TypeScript-native, and shippable now, the embedded backend is objectively the
best fit. Medusa v2 is the runner-up if the catalog ever needs marketplace
complexity and a dedicated backend team.
