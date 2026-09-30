import { db, type Row } from "@/lib/db";
import { safe } from "@/lib/server";
import DbError from "@/components/DbError";
import ProductCard from "@/components/ProductCard";
import { money } from "@/lib/format";
import { getSiteTheme } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data, down } = await safe(async () => {
    const sql = db();
    const theme = await getSiteTheme();
    const feat = await sql`SELECT * FROM products WHERE active = TRUE AND featured = TRUE ORDER BY rating_count DESC, id ASC LIMIT 6`;
    const picks = await sql`SELECT * FROM products WHERE active = TRUE ORDER BY rating DESC, id ASC LIMIT 2`;
    const cats = await sql`SELECT * FROM categories`;
    return { feat, picks, cats, theme };
  });
  if (down || !data) return <DbError />;
  const feat = data.feat as Row[];
  const picks = data.picks as Row[];
  const cats = data.cats as Row[];
  const theme = data.theme;
  const heroLines = String(theme.hero_title || "").split("\n");
  const card = (p: Row) => ({
    id: p.id as number, name: p.name as string, slug: p.slug as string,
    sub: (p.sub as string) ?? "", price_cents: p.price_cents as number, stock: p.stock as number,
    image_url: String((p as Row).image_url ?? ""), badge: String((p as Row).badge ?? ""),
  });
  return (
    <div className="grid2">
      <div>
        <section className="hero" style={{ display: "grid", gridTemplateColumns: theme.hero_image_url ? "1.3fr 0.7fr" : "1fr", gap: 16, alignItems: "center" }}>
          <div>
            <h1 style={{ whiteSpace: "pre-line" }}>{heroLines.map((l, i) => i === 1 ? <span key={i}>your <em>{l.replace(/^your\s*/i, "")}</em></span> : <span key={i}>{l}{i < heroLines.length - 1 ? <br /> : null}</span>)}</h1>
            <p>{String(theme.hero_subtitle)}</p>
            <a className="cta" href="/products">{String(theme.hero_cta_text || "Shop Now")}</a>
            <a className="ghostbtn" href="/faq">Ask us anything</a>
            <div className="trust">
              <span><b>✓</b>{String(theme.trust_1)}</span>
              <span><b>✓</b>{String(theme.trust_2)}</span>
              <span><b>✓</b>{String(theme.trust_3)}</span>
            </div>
            <div className="dots"><i /><i className="on" /><i /></div>
          </div>
          {theme.hero_image_url ? (
            <div style={{ borderRadius: 18, overflow: "hidden", minHeight: 220 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={String(theme.hero_image_url)} alt="hero" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          ) : null}
        </section>
        <div className="rowhead"><h2>{String(theme.featured_title || "Featured Lenses")}</h2><a href="/products">Show all</a></div>
        <div className="feat">{feat.map((p) => <ProductCard key={p.id as number} p={card(p)} />)}</div>
        <div className="rowhead"><h2>Why photographers trust us</h2></div>
        <div className="feat">
          <div className="card" style={{ padding: 20 }}><h3>Fisheye for the aesthetic</h3><p style={{ fontSize: 13, color: "var(--sa-ink-soft)", marginTop: 6 }}>Sweeping distorted curls and dreamy wide frames.</p></div>
          <div className="card" style={{ padding: 20 }}><h3>Macro for the detail</h3><p style={{ fontSize: 13, color: "var(--sa-ink-soft)", marginTop: 6 }}>Crisp professional close-ups of tiny subjects.</p></div>
          <div className="card" style={{ padding: 20 }}><h3>Swap in seconds</h3><p style={{ fontSize: 13, color: "var(--sa-ink-soft)", marginTop: 6 }}>Click on, click off — never miss a moment.</p></div>
        </div>
      </div>
      <div>
        <div className="sideimg" style={{ overflow: "hidden" }}>
          {theme.hero_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={String(theme.hero_image_url)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : <span style={{ fontSize: 64 }}>{String(theme.hero_image_emoji || "📷")}</span>}
        </div>
        <div className="rowhead"><h2>Lens Categories</h2><a href="/products">Show all</a></div>
        <div className="cats">{cats.map((c) => <a key={c.id as number} href={"/products?cat=" + c.slug}>{c.name as string}</a>)}</div>
        <div className="rowhead"><h2>Top Picks</h2><a href="/products">Show all</a></div>
        {picks.map((p) => (
          <a className="pick" key={p.id as number} href={"/product/" + (p.slug as string)}>
            <div className="thumb" style={{ overflow: "hidden" }}>
              {String((p as Row).image_url ?? "") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={String((p as Row).image_url)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /></svg>}
            </div>
            <div><h3>{p.name as string}</h3><small>{(p.sub as string) ?? ""}</small><br /><b>{money(p.price_cents as number)}</b></div>
          </a>
        ))}
      </div>
    </div>
  );
}
