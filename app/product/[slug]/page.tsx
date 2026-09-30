import { notFound } from "next/navigation";
import { db, type Row } from "@/lib/db";
import { safe } from "@/lib/server";
import DbError from "@/components/DbError";
import ProductCard from "@/components/ProductCard";
import ProductView from "@/components/ProductView";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const { data, down } = await safe(async () => {
    const sql = db();
    const rows = await sql`SELECT p.*, c.slug AS catslug, c.name AS catname FROM products p
      LEFT JOIN categories c ON c.id = p.cat_id WHERE p.slug = ${params.slug} AND p.active = TRUE`;
    if (!rows[0]) return null;
    const p = rows[0] as Row;
    const revs = await sql`SELECT * FROM reviews WHERE product_id = ${p.id} AND approved = TRUE ORDER BY id DESC`;
    const ups = await sql`SELECT * FROM products WHERE id <> ${p.id} AND active = TRUE LIMIT 3`;
    let variants: Row[] = [];
    let images: Row[] = [];
    try {
      variants = (await sql`SELECT * FROM product_variants WHERE product_id = ${p.id} AND active = TRUE ORDER BY position, id`) as Row[];
    } catch { variants = []; }
    try {
      images = (await sql`SELECT url FROM product_images WHERE product_id = ${p.id} ORDER BY position, id`) as Row[];
    } catch { images = []; }
    return { p, revs, ups, variants, images };
  });
  if (down) return <DbError />;
  if (!data) notFound();
  const { p, revs, ups, variants, images } = data;
  const vp = {
    id: p.id as number, name: p.name as string, price_cents: p.price_cents as number,
    old_cents: (p.old_cents as number | null) ?? null, stock: p.stock as number,
    rating: Number(p.rating), rating_count: p.rating_count as number, description: (p.description as string) ?? "",
    image_url: String((p as Row).image_url ?? ""),
  };
  const vv = (variants as Row[]).map((v) => ({
    id: v.id as number,
    name: String(v.name),
    sku: String(v.sku ?? ""),
    effective_price: ((v.price_cents as number | null) ?? (p.price_cents as number)) as number,
    effective_stock: ((v.stock as number | null) ?? (p.stock as number)) as number,
  }));
  const gallery = [...new Set([
    ...(images as Row[]).map((r) => String(r.url)).filter(Boolean),
    String((p as Row).image_url ?? ""),
  ].filter(Boolean))];
  return (
    <>
      <div className="crumbs"><a href="/">Home</a> / <a href="/products">Products</a> / <b>{vp.name}</b></div>
      <ProductView p={vp} revCount={(revs as unknown[]).length} variants={vv} images={gallery} />
      <div className="rowhead"><h2>Reviews</h2><a href="/reviews">Show all</a></div>
      {(revs as Row[]).slice(0, 3).map((r) => (
        <article className="card rev" key={r.id as number}>
          <header><span className="stars">★★★★★</span><span className="verified">Verified</span></header>
          <h3>{r.title as string}</h3><p style={{ margin: "6px 0" }}>{r.text as string}</p>
          <small style={{ color: "var(--sa-ink-soft)" }}>— {r.name as string}</small>
        </article>
      ))}
      <div className="rowhead"><h2>Frequently bought together</h2><a href="/products">Show all</a></div>
      <div className="feat">
        {(ups as Row[]).map((u) => (
          <ProductCard key={u.id as number} p={{
            id: u.id as number, name: u.name as string, slug: u.slug as string,
            sub: (u.sub as string) ?? "", price_cents: u.price_cents as number, stock: u.stock as number,
            image_url: String((u as Row).image_url ?? ""), badge: String((u as Row).badge ?? ""),
          }} />
        ))}
      </div>
    </>
  );
}
