import { getSetting } from "@/lib/orders";

export const dynamic = "force-dynamic";

export const metadata = { title: "Returns & refunds · Simple Lens" };

export default async function Returns() {
  const store = await getSetting("store_name", "Simple Lens").catch(() => "Simple Lens");
  return (
    <>
      <div className="crumbs"><a href="/">Home</a> / <b>Returns</b></div>
      <div className="card" style={{ padding: 32, maxWidth: 760 }}>
        <h1 style={{ fontSize: 30, letterSpacing: "-.02em" }}>Returns &amp; refunds</h1>
        <div className="legal-body">
          <h3>30-day returns</h3>
          <p>Unopened items can be returned within 30 days of delivery. To start a return, open a support ticket from your account with your order number.</p>
          <h3>Guarantee</h3>
          <p>Every lens carries a one-year quality guarantee covering manufacturing defects — a faulty lens is replaced or refunded.</p>
          <h3>Refunds</h3>
          <p>Approved refunds are issued to the original payment method. Cash-on-delivery orders are refunded in cash or as store balance, as agreed with support.</p>
          <h3>What this page does not cover</h3>
          <p>[Editable placeholder — the store owner should add exact return shipping responsibilities, restocking fees if any, and the refund timeline here.]</p>
          <p style={{ fontSize: 13 }}>Store: {store}. All amounts in MAD.</p>
        </div>
      </div>
    </>
  );
}
