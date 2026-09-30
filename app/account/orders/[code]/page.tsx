import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db, type Row } from "@/lib/db";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

const PILL: Record<string, string> = { paid: "st-ok", completed: "st-ok", pending: "st-warn", refunded: "st-mut", cancelled: "st-err" };

export default async function OrderDetail({ params }: { params: { code: string } }) {
  const session = await auth();
  const uid = Number((session?.user as { id?: string })?.id);
  const rows = (await db()`SELECT * FROM orders WHERE code = ${params.code} AND user_id = ${uid}`) as Row[];
  const o = rows[0];
  if (!o) notFound();
  const items = (await db()`SELECT * FROM order_items WHERE order_id = ${o.id}`) as Row[];
  return (
    <>
      <div className="crumbs"><a href="/account/orders">Orders</a> / <b>{String(o.code)}</b></div>
      <h1 style={{ fontSize: 26 }}>Order {String(o.code)}</h1>
      <p style={{ color: "var(--sa-ink-soft)", fontSize: 14, margin: "6px 0 20px" }}>
        {String(o.created).slice(0, 16)} · <span className={"status-pill " + (PILL[String(o.status)] ?? "st-mut")}>{String(o.status)}</span>
        {o.payment_method ? <> · {String(o.payment_method)}</> : null}
        {o.shipping_method ? <> · {String(o.shipping_method)}</> : null}
      </p>
      <div className="bgrid2">
        <div className="card" style={{ padding: 20 }}>
          <h3>Items</h3>
          {items.map((it) => (
            <div key={it.id as number} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "8px 0", borderTop: "1px solid var(--sa-line)" }}>
              <span>{String(it.name)}{it.variant ? ` (${String(it.variant)})` : ""} × {Number(it.qty)}</span>
              <b>{money(Number(it.price_cents) * Number(it.qty))}</b>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, paddingTop: 10 }}>
            <span style={{ color: "var(--sa-ink-soft)" }}>Subtotal</span><b>{money(o.subtotal_cents as number)}</b>
          </div>
          {(o.discount_cents as number) > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#2E9E5B" }}>
              <span>Discount{o.coupon ? ` (${String(o.coupon)})` : ""}</span><b>−{money(o.discount_cents as number)}</b>
            </div>
          )}
          {(o.shipping_cents as number) > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: "var(--sa-ink-soft)" }}>Shipping</span><b>{money(o.shipping_cents as number)}</b>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, marginTop: 6 }}>
            <span>Total</span><b>{money(o.total_cents as number)}</b>
          </div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <h3>Shipping</h3>
          <p style={{ fontSize: 14, marginTop: 8 }}>
            {String(o.shipping_name || "—")}<br />
            {String(o.shipping_line1 || "")}{o.shipping_line2 ? `, ${String(o.shipping_line2)}` : ""}<br />
            {String(o.shipping_city || "")}{o.shipping_postal ? ` ${String(o.shipping_postal)}` : ""}, {String(o.shipping_country || "")}<br />
            <small style={{ color: "var(--sa-ink-soft)" }}>{String(o.shipping_phone || "")} · {String(o.email || "")}</small>
          </p>
          {String(o.status) === "pending" && (
            <a className="btn" style={{ marginTop: 12 }} href={`/pay/${String(o.code)}`}>Pay now</a>
          )}
        </div>
      </div>
    </>
  );
}
