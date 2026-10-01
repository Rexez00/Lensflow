import { getSetting } from "@/lib/orders";

export const dynamic = "force-dynamic";

export const metadata = { title: "Privacy policy · Simple Lens" };

export default async function Privacy() {
  const store = await getSetting("store_name", "Simple Lens").catch(() => "Simple Lens");
  const email = await getSetting("contact_email", "").catch(() => "");
  return (
    <>
      <div className="crumbs"><a href="/">Home</a> / <b>Privacy</b></div>
      <div className="card" style={{ padding: 32, maxWidth: 760 }}>
        <h1 style={{ fontSize: 30, letterSpacing: "-.02em" }}>Privacy policy</h1>
        <div className="legal-body">
          <h3>What we collect</h3>
          <p>{store} collects only what is needed to run the store: your account details, delivery addresses, order history and support messages.</p>
          <h3>How we use it</h3>
          <p>Your data is used to process orders, deliver parcels, handle payments and answer support requests. We never sell your personal data.</p>
          <h3>Cookies</h3>
          <p>We use cookies for sign-in sessions, your shopping cart and remembering your preferences. You can accept all cookies or essential ones only in the cookie banner.</p>
          <h3>Your rights</h3>
          <p>You can view and update your profile, addresses and orders from your account at any time. To request deletion of your data, contact us{email ? <> at {email}</> : " via the Contact page"}.</p>
          <h3>[Editable placeholder]</h3>
          <p>The store owner should complete this policy with the legal entity name, registered address, data-retention periods and the applicable Moroccan data-protection (CNDP / Law 09-08) contact details.</p>
        </div>
      </div>
    </>
  );
}
