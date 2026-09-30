import { db , type Row} from "@/lib/db";
import { safe } from "@/lib/server";
import DbError from "@/components/DbError";
import ProductCard from "@/components/ProductCard";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data, down } = await safe(async () => {
    const sql = db();
    const feat = await sql`SELECT * FROM products WHERE active = TRUE ORDER BY rating_count DESC, id ASC LIMIT 3`;
    const picks = await sql`SELECT * FROM products WHERE active = TRUE ORDER BY rating DESC, id ASC LIMIT 2`;
    const cats = await sql`SELECT * FROM categories`;
    return { feat, picks, cats };
  });
  if (down || !data) return <DbError />;
  const feat = data.feat as Row[];
  const picks = data.picks as Row[];
  const cats = data.cats as Row[];
  const card = (p: Row) => ({
    id: p.id as number, name: p.name as string, slug: p.slug as string,
    sub: (p.sub as string) ?? "", price_cents: p.price_cents as number, stock: p.stock as number,
  });
  return (
    <div className="grid2">
      <div>
        <section className="hero">
          <h1>Unleash<br />your <em>creativity</em></h1>
          <p>PocketLens makes quality mobile fisheye lenses for a cool, nostalgic aesthetic and macro lenses for professional zoom-ins.</p>
          <a className="cta" href="/products">Shop Now</a>
          <a className="ghostbtn" href="/faq">Ask us anything</a>
          <div className="trust">
            <span><b>✓</b>Free tracked shipping</span>
            <span><b>✓</b>Fits almost any phone</span>
            <span><b>✓</b>One-year guarantee</span>
          </div>
          <div className="dots"><i /><i className="on" /><i /></div>
        </section>
        <div className="rowhead"><h2>Featured Lenses</h2><a href="/products">Show all</a></div>
        <div className="feat">{feat.map((p) => <ProductCard key={p.id as number} p={card(p)} />)}</div>
        <div className="rowhead"><h2>Why photographers trust us</h2></div>
        <div className="feat">
          <div className="card" style={{ padding: 20 }}><h3>Fisheye for the aesthetic</h3><p style={{ fontSize: 13, color: "var(--sa-ink-soft)", marginTop: 6 }}>Sweeping distorted curls and dreamy wide frames.</p></div>
          <div className="card" style={{ padding: 20 }}><h3>Macro for the detail</h3><p style={{ fontSize: 13, color: "var(--sa-ink-soft)", marginTop: 6 }}>Crisp professional close-ups of tiny subjects.</p></div>
          <div className="card" style={{ padding: 20 }}><h3>Swap in seconds</h3><p style={{ fontSize: 13, color: "var(--sa-ink-soft)", marginTop: 6 }}>Click on, click off — never miss a moment.</p></div>
        </div>
      </div>
      <div>
        <div className="sideimg" style={{ fontSize: 64 }}>📷</div>
        <div className="rowhead"><h2>Lens Categories</h2><a href="/products">Show all</a></div>
        <div className="cats">{cats.map((c) => <a key={c.id as number} href={"/products?cat=" + c.slug}>{c.name as string}</a>)}</div>
        <div className="rowhead"><h2>Top Picks</h2><a href="/products">Show all</a></div>
        {picks.map((p) => (
          <a className="pick" key={p.id as number} href={"/product/" + (p.slug as string)}>
            <div className="thumb"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /></svg></div>
            <div><h3>{p.name as string}</h3><small>{(p.sub as string) ?? ""}</small><br /><b>{money(p.price_cents as number)}</b></div>
          </a>
        ))}
      </div>
    </div>
  );
}
