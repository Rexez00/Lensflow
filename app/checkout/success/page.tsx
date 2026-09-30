import { redirect } from "next/navigation";
import { db , type Row} from "@/lib/db";
import { markPaid } from "@/lib/orders";
import { stripeClient } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export default async function SuccessPage({ searchParams }: { searchParams: { code?: string; session_id?: string } }) {
  let code = searchParams.code ?? "";
  if (searchParams.session_id) {
    const stripe = stripeClient();
    if (stripe) {
      try {
        const s = await stripe.checkout.sessions.retrieve(searchParams.session_id);
        const c = s.metadata?.order_code;
        if (s.payment_status === "paid" && c) {
          const rows = await db()`SELECT id FROM orders WHERE code = ${c}`;
          if (rows[0]) await markPaid((rows[0] as Row).id as number);
          code = c;
        }
      } catch { /* fall through to code lookup */ }
    }
  }
  if (!code) redirect("/");
  const rows = await db()`SELECT * FROM orders WHERE code = ${code}`;
  const o = rows[0] as Row | undefined;
  if (!o) redirect("/");
  return (
    <div className="card" style={{ maxWidth: 560, padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 52 }}>✅</div>
      <h1 style={{ fontSize: 28, margin: "12px 0" }}>Payment successful</h1>
      <p style={{ color: "var(--sa-ink-soft)" }}>Order <b>{String(o.code)}</b> · status: <b>{String(o.status)}</b></p>
      <div style={{ marginTop: 22, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <a className="btn" href="/products">Keep shopping</a>
        <a className="btn ghost" href="/account/orders">View orders</a>
      </div>
    </div>
  );
}
