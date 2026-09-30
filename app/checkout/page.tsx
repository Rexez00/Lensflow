import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db, type Row } from "@/lib/db";
import { readCart, enrichCart } from "@/lib/cart";
import { checkoutTotals } from "@/lib/orders";
import { money } from "@/lib/format";
import { placeOrderAction } from "@/actions/shop";
import { listShippingMethods } from "@/lib/shipping";
import { availableProviders } from "@/lib/payments";
import CheckoutForm from "@/components/CheckoutForm";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ searchParams }: { searchParams: { error?: string } }) {
  const cart = await readCart();
  const { lines, total: subtotal } = await enrichCart(cart);
  if (!lines.length) redirect("/cart");
  const session = await auth();
  const uid = (session?.user as { id?: string } | undefined)?.id;
  let reseller = "none";
  let email = "";
  let balance = 0;
  let addrs: Row[] = [];
  if (uid) {
    const r = await db()`SELECT reseller_status, email, balance_cents FROM users WHERE id = ${Number(uid)}`;
    reseller = String((r[0] as Row | undefined)?.reseller_status ?? "none");
    email = String((r[0] as Row | undefined)?.email ?? "");
    balance = Number((r[0] as Row | undefined)?.balance_cents ?? 0);
    try {
      addrs = (await db()`SELECT * FROM addresses WHERE user_id = ${Number(uid)} ORDER BY id`) as Row[];
    } catch { addrs = []; }
  }
  const ships = await listShippingMethods();
  const shipOpts = (ships.length ? ships : [{ name: "Standard", description: "", price_cents: 0, eta: "" }]).map((s) => ({
    name: s.name, description: s.description, price_cents: s.price_cents, eta: s.eta,
  }));
  // Totals preview uses the cheapest/first method; the form updates live client-side.
  const previewShip = shipOpts[0]?.price_cents ?? 0;
  const { discount, couponCode } = await checkoutTotals(subtotal, { reseller_status: reseller }, cart?.coupon ?? "", previewShip);
  const pays = availableProviders({ total: subtotal + previewShip, balance, signedIn: !!uid }).map((p) => ({
    id: p.id, name: p.name, tagline: p.tagline, kind: p.kind,
  }));
  return (
    <>
      <div className="crumbs"><a href="/">Home</a> / <a href="/cart">Cart</a> / <b>Checkout</b></div>
      <h1 style={{ fontSize: 30, letterSpacing: "-.02em", marginBottom: 18 }}>Checkout</h1>
      <div className="layout" style={{ gridTemplateColumns: "1fr 320px" }}>
        <div>
          <CheckoutForm
            action={placeOrderAction}
            subtotal={subtotal}
            discount={discount}
            couponCode={couponCode}
            ships={shipOpts}
            pays={pays.length ? pays : [{ id: "cod", name: "Cash on Delivery", tagline: "Pay on delivery.", kind: "manual" }]}
            addrs={addrs.map((a) => ({
              id: a.id as number, label: String(a.label ?? ""), full_name: String(a.full_name ?? ""),
              phone: String(a.phone ?? ""), line1: String(a.line1 ?? ""), line2: String(a.line2 ?? ""),
              city: String(a.city ?? ""), region: String(a.region ?? ""), postal: String(a.postal ?? ""),
              country: String(a.country ?? "Morocco"),
            }))}
            email={email}
            error={searchParams.error}
          />
        </div>
        <aside className="card" style={{ padding: 22, position: "sticky", top: 88, alignSelf: "start" }}>
          <h3>Order ({lines.length})</h3>
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {lines.map((it) => (
              <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13 }} key={it.id + it.variant}>
                <div className="thumb" style={{ width: 48, minHeight: 48, flexShrink: 0, overflow: "hidden" }}>
                  {it.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /></svg>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.name}</b>
                  <small style={{ color: "var(--sa-ink-soft)" }}>{it.variant} × {it.qty}</small>
                </div>
                <b>{money(it.line)}</b>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
