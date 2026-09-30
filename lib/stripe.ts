import Stripe from "stripe";
import { siteUrl } from "./shop";

let _stripe: Stripe | null = null;

/** Server-side Stripe client, or null when keys are absent (DemoPay mode). */
export function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!_stripe) _stripe = new Stripe(key);
  return _stripe;
}

export function stripeOn() {
  return !!process.env.STRIPE_SECRET_KEY;
}

export async function createCheckoutSession(order: {
  code: string;
  items: { name: string; qty: number; price: number }[];
}) {
  const stripe = stripeClient();
  if (!stripe) throw new Error("Stripe is not configured");
  return stripe.checkout.sessions.create({
    mode: "payment",
    line_items: order.items.map((it) => ({
      price_data: {
        currency: "usd",
        unit_amount: it.price,
        product_data: { name: it.name },
      },
      quantity: it.qty,
    })),
    metadata: { order_code: order.code },
    success_url: `${siteUrl()}/checkout/success?code=${order.code}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}/pay/${order.code}`,
  });
}
