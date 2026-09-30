import { redirect } from "next/navigation";
import { db, type Row } from "@/lib/db";
import { markPaid } from "@/lib/orders";
import { stripeClient } from "@/lib/stripe";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { code?: string; session_id?: string; method?: string };
}) {
  let code = searchParams.code ?? "";
  if (searchParams.session_id) {
    const stripe = stripeClient();
    if (stripe) {
      try {
        const s = await stripe.checkout.sessions.retrieve(searchParams.session_id);
        const c = s.metadata?.order_code;
        if (s.payment_status === "paid" && c) {
          const rows = await db()`SELECT id FROM orders WHERE code = ${c}`;
          if (rows[0]) {
            await db()`UPDATE orders SET payment_method = 'stripe' WHERE id = ${(rows[0] as Row).id}`;
            await markPaid((rows[0] as Row).id as number);
          }
          code = c;
        }
      } catch { /* fall through to code lookup */ }
    }
  }
  if (!code) redirect("/");
  const rows = await db()`SELECT * FROM orders WHERE code = ${code}`;
  const o = rows[0] as Row | undefined;
  if (!o) redirect("/");
  const method = searchParams.method ?? String(o.payment_method ?? "");
  const isCod = method === "cod" || String(o.payment_method) === "cod";
  return (
    <div className="card" style={{ maxWidth: 560, padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 52 }}>{isCod ? "📦" : "✅"}</div>
      <h1 style={{ fontSize: 28, margin: "12px 0" }}>
        {isCod ? "Order placed!" : "Payment successful"}
      </h1>
      <p style={{ color: "var(--sa-ink-soft)" }}>
        Order <b>{String(o.code)}</b> · status: <b>{String(o.status)}</b> · total <b>{money(o.total_cents as number)}</b>
      </p>
      {isCod ? (
        <p style={{ fontSize: 14, marginTop: 12 }}>
          Thank you, {String(o.shipping_name || "friend")}! Please have{" "}
          <b>{money(o.total_cents as number)}</b> ready in cash — our courier collects
          on delivery to {String(o.shipping_city || "")}.
        </p>
      ) : null}
      <div style={{ marginTop: 22, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <a className="btn" href="/products">Keep shopping</a>
        <a className="btn ghost" href="/account/orders">View orders</a>
      </div>
    </div>
  );
}
