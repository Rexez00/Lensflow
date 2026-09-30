import { stripeOn } from "./stripe";

/**
 * Payment provider registry.
 * Every checkout/payment option flows through here so a new provider
 * (e.g. CMI / PayZone for Morocco) can be added without rewriting checkout.
 *
 * - `cod`: Cash on Delivery — always available, no credentials.
 * - `balance`: store balance — only when the signed-in user can cover the total.
 * - `stripe`: card via Stripe Checkout — only when STRIPE_SECRET_KEY is set.
 * - `demopay`: labelled test rail — only when Stripe is NOT configured.
 * - `cmi`: Morocco CMI stub — disabled until CMI_* env vars are set.
 */

export type PaymentKind = "online" | "manual" | "balance";

export type PaymentProvider = {
  id: string;
  name: string;
  tagline: string;
  kind: PaymentKind;
  /** True when the provider can be offered for this order. */
  available: (ctx: { total: number; balance: number; signedIn: boolean }) => boolean;
  requiresCredentials: boolean;
  credentialHint?: string;
};

export const PROVIDERS: PaymentProvider[] = [
  {
    id: "cod",
    name: "Cash on Delivery",
    tagline: "Pay in cash when your order arrives. No online payment needed.",
    kind: "manual",
    available: () => true,
    requiresCredentials: false,
  },
  {
    id: "balance",
    name: "Store balance",
    tagline: "Pay instantly from your account balance.",
    kind: "balance",
    available: ({ total, balance, signedIn }) => signedIn && balance >= total && total > 0,
    requiresCredentials: false,
  },
  {
    id: "stripe",
    name: "Card (Stripe)",
    tagline: "Visa / Mastercard via Stripe Checkout.",
    kind: "online",
    available: () => stripeOn(),
    requiresCredentials: true,
    credentialHint: "Set STRIPE_SECRET_KEY (+ STRIPE_WEBHOOK_SECRET) to enable.",
  },
  {
    id: "demopay",
    name: "DemoPay (test)",
    tagline: "Labelled test gateway. No real money moves.",
    kind: "online",
    available: () => !stripeOn(),
    requiresCredentials: false,
  },
  {
    id: "cmi",
    name: "CMI (Morocco)",
    tagline: "Centre Monétique Interbancaire — Moroccan cards. Coming soon.",
    kind: "online",
    // Disabled until real CMI credentials + server-side integration exist.
    // To enable: set CMI_MERCHANT_ID / CMI_SECRET_KEY and implement
    // lib/cmi.ts (redirect + callback verification), then flip this on.
    available: () => !!process.env.CMI_MERCHANT_ID && !!process.env.CMI_SECRET_KEY,
    requiresCredentials: true,
    credentialHint:
      "Requires a CMI merchant account (Morocco). Set CMI_MERCHANT_ID + CMI_SECRET_KEY, then implement the CMI redirect/callback.",
  },
];

export function availableProviders(ctx: { total: number; balance: number; signedIn: boolean }) {
  return PROVIDERS.filter((p) => {
    try {
      return p.available(ctx);
    } catch {
      return false;
    }
  });
}

export function providerById(id: string): PaymentProvider | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

/** Payment methods allowed to be stored on orders.payment_method. */
export const ORDER_PAYMENT_METHODS = ["cod", "balance", "stripe", "demopay", "cmi"] as const;
