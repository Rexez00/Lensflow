# Deploying Simple Lens (free tier)

Code is on GitHub (`main`, builds clean with `npm run build`). Database is live on
Neon free tier (`rapid-silence-90289871`, branch `production`): schema migrated,
catalog EMPTY (0 products / 0 orders), brand settings = Simple Lens / MAD.

The only step needing you is connecting hosting (requires your login).

## Option A — Netlify (recommended, `netlify.toml` already configured)

1. https://app.netlify.com → **Add new site → Import an existing project** →
   GitHub `Rexez00/Lensflow` (base directory = repo root, build `npm run build`).
2. **Site settings → Environment variables**, add:
   - `DATABASE_URL` = Neon pooled URL (`...-pooler....neon.tech/neondb?sslmode=require`)
   - `AUTH_SECRET` = generate: `openssl rand -base64 32`
   - `AUTH_TRUST_HOST` = `true`
   - `NEXT_PUBLIC_SITE_URL` = `https://YOUR-site.netlify.app`
3. Deploy. Open `https://YOUR-site.netlify.app/admin` and add your first product —
   it appears on the storefront immediately (same database).

## Option B — Vercel

Same env vars; import the repo, framework preset Next.js, deploy.

## Later (all optional — store works without them)

- **Cards (Stripe):** Stripe Dashboard → Developers → API keys → set
  `STRIPE_SECRET_KEY`; Webhooks → add endpoint
  `https://YOUR-site/api/stripe/webhook` → set `STRIPE_WEBHOOK_SECRET`.
  Without keys, checkout uses Cash on Delivery + the labelled DemoPay test rail.
- **CMI (Morocco):** set `CMI_MERCHANT_ID` + `CMI_SECRET_KEY`, then implement
  the redirect/callback in `lib/cmi.ts` (checkout exposes the provider automatically).
- **Email (Resend free tier):** set `RESEND_API_KEY` + `EMAIL_FROM="Simple Lens <store@yourdomain>"`.
  Enables password-reset + order emails. Until then the app logs mail to the
  server console and says so honestly in the UI.
- **Admin login:** `admin@lensflow.shop` (change the password after first login
  via your profile; admin email can be changed in DB seed env for fresh installs).
