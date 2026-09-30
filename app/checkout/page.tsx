import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db , type Row} from "@/lib/db";
import { readCart, enrichCart } from "@/lib/cart";
import { checkoutTotals } from "@/lib/orders";
import { money } from "@/lib/format";
import { setCouponAction, placeOrderAction } from "@/actions/shop";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const cart = await readCart();
  const { lines, total: subtotal } = await enrichCart(cart);
  if (!lines.length) redirect("/cart");
  const session = await auth();
  const uid = (session?.user as { id?: string } | undefined)?.id;
  let reseller = "none";
  if (uid) {
    const r = await db()`SELECT reseller_status FROM users WHERE id = ${Number(uid)}`;
    reseller = String((r[0] as Row | undefined)?.reseller_status ?? "none");
  }
  const { total, discount, couponCode } = await checkoutTotals(subtotal, { reseller_status: reseller }, cart?.coupon ?? "");
  return (
    <>
      <div className="crumbs"><a href="/">Home</a> / <a href="/cart">Cart</a> / <b>Checkout</b></div>
      <h1 style={{ fontSize: 30, letterSpacing: "-.02em", marginBottom: 18 }}>Checkout</h1>
      <div className="layout" style={{ gridTemplateColumns: "1fr 320px" }}>
        <div>
          {lines.map((it) => (
            <div className="card" style={{ padding: 14, display: "flex", gap: 14, alignItems: "center", marginBottom: 12 }} key={it.id}>
              <div className="thumb" style={{ width: 64, minHeight: 64, flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /></svg>
              </div>
              <div style={{ flex: 1 }}><b>{it.name}</b> <small style={{ color: "var(--sa-ink-soft)" }}>× {it.qty}</small></div>
              <b>{money(it.line)}</b>
            </div>
          ))}
          <form action={setCouponAction} className="card" style={{ padding: 18, display: "flex", gap: 10 }}>
            <input className="input" name="coupon" placeholder="Coupon code (try SAVE10)" defaultValue={couponCode} />
            <button className="btn ghost">Apply</button>
          </form>
        </div>
        <aside className="card" style={{ padding: 22, position: "sticky", top: 88 }}>
          <h3>Summary</h3>
          <div style={{ display: "flex", justifyContent: "space-between", margin: "14px 0 6px", fontSize: 14 }}>
            <span style={{ color: "var(--sa-ink-soft)" }}>Subtotal</span><b>{money(subtotal)}</b>
          </div>
          {discount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14, color: "#2E9E5B" }}>
              <span>Discounts{couponCode ? ` (${couponCode})` : ""}</span><b>−{money(discount)}</b>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 16 }}>
            <span>Total</span><b>{money(total)}</b>
          </div>
          <form action={placeOrderAction}><button className="btn" style={{ width: "100%" }}>Place order →</button></form>
        </aside>
      </div>
    </>
  );
}
