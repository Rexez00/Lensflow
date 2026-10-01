import { getSetting } from "@/lib/orders";

export const dynamic = "force-dynamic";

export const metadata = { title: "About · Simple Lens" };

export default async function About() {
  const store = await getSetting("store_name", "Simple Lens").catch(() => "Simple Lens");
  return (
    <>
      <div className="crumbs"><a href="/">Home</a> / <b>About</b></div>
      <div className="card" style={{ padding: 32, maxWidth: 760 }}>
        <h1 style={{ fontSize: 30, letterSpacing: "-.02em" }}>About {store}</h1>
        <div className="legal-body">
          <p style={{ marginTop: 12 }}>
            {store} is a Moroccan store for pocket-size phone lenses — fisheye lenses for a cool,
            nostalgic aesthetic and macro lenses for crisp professional close-ups.
          </p>
          <h3>What we sell</h3>
          <p>Clip-on fisheye and macro lenses that fit almost any phone, with a universal clip you can swap in seconds.</p>
          <h3>How we deliver</h3>
          <p>We ship across Morocco with tracked delivery, and cash on delivery is available — you pay when your order arrives.</p>
          <h3>Our promise</h3>
          <p>Every lens carries a one-year quality guarantee covering manufacturing defects. Unopened items can be returned within 30 days.</p>
        </div>
      </div>
    </>
  );
}
