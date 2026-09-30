export const dynamic = "force-dynamic";

export default function Legal() {
  return (
    <>
      <div className="crumbs"><a href="/">Home</a> / <b>Terms of Service</b></div>
      <div className="card" style={{ padding: 32, maxWidth: 760 }}>
        <h1 style={{ fontSize: 30, letterSpacing: "-.02em" }}>Terms of Service</h1>
        <div className="legal-body">
          <h3>1. Orders &amp; delivery</h3><p>All orders ship tracked. Windows at checkout are estimates; tracking arrives when your label prints.</p>
          <h3>2. Guarantee</h3><p>Every lens carries a one-year quality guarantee covering manufacturing defects.</p>
          <h3>3. Returns</h3><p>Unopened items can be returned within 30 days via a support ticket.</p>
        </div>
      </div>
    </>
  );
}
