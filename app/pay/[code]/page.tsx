import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db, type Row } from "@/lib/db";
import { money } from "@/lib/format";
import { payBalanceAction, demoPayAction, startStripeAction, confirmCodAction } from "@/actions/shop";
import { stripeOn } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export default async function PayPage({ params }: { params: { code: string } }) {
  const rows = await db()`SELECT * FROM orders WHERE code = ${params.code}`;
  const o = rows[0] as Row | undefined;
  if (!o) notFound();
  if (o.status !== "pending") redirect("/");
  const session = await auth();
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (o.user_id && (!uid || Number(uid) !== (o.user_id as number))) redirect("/");
  const items = (await db()`SELECT * FROM order_items WHERE order_id = ${o.id}`) as Row[];
  let balance = 0;
  if (uid) {
    const u = await db()`SELECT balance_cents FROM users WHERE id = ${Number(uid)}`;
    balance = Number((u[0] as Row | undefined)?.balance_cents ?? 0);
  }
  const stripe = stripeOn();
  const shipTo = [o.shipping_line1, o.shipping_city, o.shipping_country].filter(Boolean).join(", ");
  return (
    <>
      <div className="crumbs"><a href="/">Home</a> / <b>Pay {String(o.code)}</b></div>
      <div style={{ maxWidth: 560 }}>
        <div className="card" style={{ padding: 24 }}>
          <h1 style={{ fontSize: 24 }}>Pay {money(o.total_cents as number)}</h1>
          <p style={{ color: "var(--sa-ink-soft)", fontSize: 14, margin: "6px 0 18px" }}>
            Order {String(o.code)} · {items.length} item(s)
            {o.shipping_method ? <> · {String(o.shipping_method)}</> : null}
            {shipTo ? <><br />Ship to: {String(o.shipping_name || "")} — {shipTo}</> : null}
          </p>
          {items.map((it) => (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "6px 0" }} key={it.id as number}>
              <span>{String(it.name)}{it.variant ? ` (${String(it.variant)})` : ""} × {Number(it.qty)}</span>
              <b>{money(Number(it.price_cents) * Number(it.qty))}</b>
            </div>
          ))}
          {(o.shipping_cents as number) > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "6px 0", color: "var(--sa-ink-soft)" }}>
              <span>Shipping ({String(o.shipping_method || "Standard")})</span>
              <b>{money(o.shipping_cents as number)}</b>
            </div>
          )}
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
            <form action={confirmCodAction.bind(null, String(o.code))}>
              <button className="btn ghost" style={{ width: "100%" }}>Cash on Delivery — pay {money(o.total_cents as number)} to the courier</button>
            </form>
            {uid && balance >= (o.total_cents as number) && (
              <form action={payBalanceAction.bind(null, String(o.code))}>
                <button className="btn" style={{ width: "100%" }}>Pay {money(o.total_cents as number)} with balance</button>
              </form>
            )}
            {stripe ? (
              <form action={startStripeAction.bind(null, String(o.code))}>
                <button className="btn" style={{ width: "100%" }}>Pay with card (Stripe)</button>
              </form>
            ) : (
              <>
                <div className="card" style={{ padding: 14, background: "var(--sa-sunken)", fontSize: 13 }}>
                  🧪 <b>DemoPay test gateway</b> — no real money moves. Add Stripe keys in <code>.env</code> for live test payments.
                </div>
                <form action={demoPayAction.bind(null, String(o.code))}>
                  <button className="btn" style={{ width: "100%" }}>Simulate successful payment</button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
