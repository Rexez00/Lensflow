import { stripeOn } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export default async function AdminPayments() {
  const stripe = stripeOn();
  const cmi = !!(process.env.CMI_MERCHANT_ID && process.env.CMI_SECRET_KEY);
  const row = (name: string, status: string, hint: string, on: boolean) => (
    <tr>
      <td><b>{name}</b><br /><small style={{ color: "var(--sa-ink-soft)" }}>{hint}</small></td>
      <td>{on ? <span className="status-pill st-ok">enabled</span> : <span className="status-pill st-mut">off</span>}</td>
      <td style={{ fontSize: 13 }}>{status}</td>
    </tr>
  );
  return (
    <>
      <h1 style={{ fontSize: 26 }}>Payments</h1>
      <p style={{ color: "var(--sa-ink-soft)", fontSize: 14, margin: "6px 0 20px" }}>
        Providers are defined in <code>lib/payments.ts</code> — add a new entry there to extend checkout without rewriting it.
      </p>
      <div className="card" style={{ padding: "8px 22px" }}><div className="twrap"><table>
        <thead><tr><th>Provider</th><th>Status</th><th>Configuration</th></tr></thead>
        <tbody>
          {row("Cash on Delivery", "Always available. Orders stay pending until delivery; admin marks paid/completed.", "No credentials. Ideal for Morocco.", true)}
          {row("Store balance", "Offered when the signed-in user can cover the total.", "No credentials.", true)}
          {row("Card (Stripe)", stripe ? "Live — card payments via Stripe Checkout + webhook." : "Disabled — set STRIPE_SECRET_KEY to enable.",
            "Needs STRIPE_SECRET_KEY (+ STRIPE_WEBHOOK_SECRET → POST /api/stripe/webhook).", stripe)}
          {row("DemoPay (test)", !stripe ? "Active test rail — no real money moves." : "Hidden while Stripe is configured.",
            "Automatic when Stripe keys are absent.", !stripe)}
          {row("CMI (Morocco)", cmi ? "Configured." : "Not configured — checkout hides it and explains the remaining step.",
            "Needs a CMI merchant account: CMI_MERCHANT_ID + CMI_SECRET_KEY, then implement lib/cmi.ts redirect/callback.", cmi)}
        </tbody>
      </table></div></div>
      <div className="card" style={{ padding: 20, marginTop: 16, fontSize: 14 }}>
        <h3>Adding another provider (e.g. PayZone, PayPal)</h3>
        <ol style={{ marginTop: 8, paddingLeft: 20, display: "grid", gap: 6 }}>
          <li>Add an entry to <code>PROVIDERS</code> in <code>lib/payments.ts</code> with an <code>available()</code> check.</li>
          <li>Handle its confirmation in <code>actions/shop.ts</code> (like <code>confirmCodAction</code> / <code>startStripeAction</code>).</li>
          <li>Store the id in <code>orders.payment_method</code> — history and admin pick it up automatically.</li>
        </ol>
      </div>
    </>
  );
}
