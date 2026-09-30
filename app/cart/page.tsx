import { readCart, enrichCart } from "@/lib/cart";
import { money } from "@/lib/format";
import CartRows from "@/components/CartRows";

export const dynamic = "force-dynamic";

export default async function CartPage({ searchParams }: { searchParams: { error?: string } }) {
  const cart = await readCart().catch(() => null);
  const { lines, total } = await enrichCart(cart).catch(() => ({ lines: [], total: 0 }));
  return (
    <>
      <div className="crumbs"><a href="/">Home</a> / <b>Cart</b></div>
      <h1 style={{ fontSize: 30, letterSpacing: "-.02em", marginBottom: 18 }}>Your cart</h1>
      {searchParams.error === "stock" ? <div className="card" style={{ padding: 14, marginBottom: 14 }}>Not enough stock for something in your cart.</div> : null}
      <div className="layout" style={{ gridTemplateColumns: "1fr 320px" }}>
        <div><CartRows initial={lines} /></div>
        {lines.length > 0 && (
          <aside className="card" style={{ padding: 22, position: "sticky", top: 88 }}>
            <h3>Summary</h3>
            <div style={{ display: "flex", justifyContent: "space-between", margin: "14px 0", fontSize: 14 }}>
              <span style={{ color: "var(--sa-ink-soft)" }}>Subtotal</span><b>{money(total)}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 16 }}>
              <span>Total</span><b>{money(total)}</b>
            </div>
            <p style={{ fontSize: 12, color: "var(--sa-ink-soft)", marginBottom: 14 }}>Taxes calculated at checkout.</p>
            <a className="btn" style={{ width: "100%" }} href="/checkout">Checkout</a>
            <a className="btn ghost" style={{ width: "100%", marginTop: 8 }} href="/products">Continue shopping</a>
          </aside>
        )}
      </div>
    </>
  );
}
