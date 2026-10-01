import { getSetting } from "@/lib/orders";

export const dynamic = "force-dynamic";

export const metadata = { title: "Terms of Service · Simple Lens" };

export default async function Legal() {
  const store = await getSetting("store_name", "Simple Lens").catch(() => "Simple Lens");
  return (
    <>
      <div className="crumbs"><a href="/">Home</a> / <b>Terms of Service</b></div>
      <div className="card" style={{ padding: 32, maxWidth: 760 }}>
        <h1 style={{ fontSize: 30, letterSpacing: "-.02em" }}>Terms of Service</h1>
        <div className="legal-body">
          <h3>1. Orders &amp; delivery</h3>
          <p>All orders ship tracked across Morocco. Windows shown at checkout are estimates; your tracking reference arrives when your label prints.</p>
          <h3>2. Prices &amp; payment</h3>
          <p>All prices are in Moroccan Dirham (MAD). We accept cash on delivery, store balance and online card payments where configured. An order is confirmed once payment is verified — reaching a success page alone does not confirm payment.</p>
          <h3>3. Guarantee</h3>
          <p>Every lens carries a one-year quality guarantee covering manufacturing defects.</p>
          <h3>4. Returns</h3>
          <p>Unopened items can be returned within 30 days — see our <a href="/returns">returns page</a>. Start a return from a support ticket in your account.</p>
          <h3>5. [Editable placeholder]</h3>
          <p>The store owner should complete these terms with the legal entity name, registered address, phone number, applicable law and dispute-resolution details before operating commercially.</p>
          <p style={{ fontSize: 13 }}>Store: {store} · Morocco · MAD.</p>
        </div>
      </div>
    </>
  );
}
