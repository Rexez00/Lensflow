import { getSetting } from "@/lib/orders";

export const dynamic = "force-dynamic";

export const metadata = { title: "Shipping policy · Simple Lens" };

export default async function Shipping() {
  const store = await getSetting("store_name", "Simple Lens").catch(() => "Simple Lens");
  return (
    <>
      <div className="crumbs"><a href="/">Home</a> / <b>Shipping</b></div>
      <div className="card" style={{ padding: 32, maxWidth: 760 }}>
        <h1 style={{ fontSize: 30, letterSpacing: "-.02em" }}>Shipping policy</h1>
        <div className="legal-body">
          <h3>Where we ship</h3>
          <p>{store} ships anywhere in Morocco. Delivery options and prices are shown at checkout before you pay.</p>
          <h3>Timing</h3>
          <p>Delivery windows shown at checkout are estimates. Your tracking reference is issued when your shipping label prints.</p>
          <h3>Cash on delivery</h3>
          <p>With cash on delivery, your order stays pending until it arrives — you pay the courier in cash (MAD).</p>
          <h3>Issues</h3>
          <p>If a parcel is delayed, lost or arrives damaged, open a support ticket from your account and we will make it right.</p>
        </div>
      </div>
    </>
  );
}
