import { db , type Row} from "@/lib/db";
import { safe } from "@/lib/server";
import DbError from "@/components/DbError";
import ProductCard from "@/components/ProductCard";
import SortSelect from "@/components/SortSelect";

export const dynamic = "force-dynamic";

export default async function Products({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const { data, down } = await safe(async () => {
    const sql = db();
    const cats = await sql`SELECT * FROM categories`;
    const conds: string[] = ["active = TRUE"];
    const args: unknown[] = [];
    let i = 1;
    const push = (c: string, v: unknown) => { conds.push(c.replace(/\?/g, () => `$${i++}`)); args.push(v); };
    if (searchParams.cat) push("cat_id = (SELECT id FROM categories WHERE slug = ?)", searchParams.cat);
    if (searchParams.q) { push("(name ILIKE ? OR sub ILIKE ?)", `%${searchParams.q}%`); args.push(`%${searchParams.q}%`); i++; }
    if (searchParams.min) push("price_cents >= ?", Math.round(Number(searchParams.min) * 100));
    if (searchParams.max) push("price_cents <= ?", Math.round(Number(searchParams.max) * 100));
    if (searchParams.stock === "1") conds.push("stock > 0");
    const order = { lo: "price_cents", hi: "price_cents DESC", rate: "rating DESC" }[searchParams.sort ?? ""] ?? "rating_count DESC";
    const items = await sql.unsafe(
      `SELECT p.*, c.slug AS catslug FROM products p LEFT JOIN categories c ON c.id = p.cat_id WHERE ${conds.join(" AND ")} ORDER BY ${order}`,
      args as never[]
    );
    return { cats, items };
  });
  if (down || !data) return <DbError />;
  const q = (k: string) => searchParams[k] ?? "";
  const link = (patch: Record<string, string>) => {
    const sp = new URLSearchParams();
    for (const k of ["cat", "q", "min", "max", "stock", "sort"]) {
      const v = patch[k] !== undefined ? patch[k] : searchParams[k];
      if (v) sp.set(k, v);
    }
    return "/products?" + sp.toString();
  };
  return (
    <>
      <div className="crumbs"><a href="/">Home</a> / <b>Products</b></div>
      <h1 style={{ fontSize: 30, letterSpacing: "-.02em" }}>All products</h1>
      <p style={{ color: "var(--sa-ink-soft)", fontSize: 14, margin: "6px 0 20px" }}>Pocket-size glass for every phone.</p>
      <div className="layout">
        <aside className="filters card">
          <form method="get" action="/products">
            {searchParams.cat ? <input type="hidden" name="cat" value={searchParams.cat} /> : null}
            <h4>Categories</h4>
            <a className={"catlink" + (!searchParams.cat ? " on" : "")} href="/products">All</a>
            {(data.cats as Row[]).map((c) => (
              <a key={c.id as number} className={"catlink" + (searchParams.cat === c.slug ? " on" : "")} href={link({ cat: String(c.slug) })}>{c.name as string}</a>
            ))}
            <h4>Search</h4>
            <input className="input" name="q" defaultValue={q("q")} placeholder="Keyword…" />
            <h4>Price</h4>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="input" name="min" type="number" min="0" defaultValue={q("min")} placeholder="Min" />
              <input className="input" name="max" type="number" min="0" defaultValue={q("max")} placeholder="Max" />
            </div>
            <label className="fl" style={{ marginTop: 12 }}>
              <input type="checkbox" name="stock" value="1" defaultChecked={q("stock") === "1"} /> In stock only
            </label>
            <button className="btn" style={{ width: "100%", marginTop: 10 }}>Apply filters</button>
            <a href="/products" style={{ display: "block", textAlign: "center", fontSize: 13, marginTop: 10, color: "var(--sa-ink-soft)" }}>Reset</a>
          </form>
        </aside>
        <div>
          <div className="toolbar">
            <span className="count">{(data.items as unknown[]).length} products</span>
            <SortSelect value={q("sort") || "feat"} params={{ cat: q("cat"), q: q("q"), min: q("min"), max: q("max"), stock: q("stock") }} />
          </div>
          {(data.items as unknown[]).length ? (
            <div className="pgrid">
              {(data.items as Row[]).map((p) => (
                <ProductCard key={p.id as number} p={{
                  id: p.id as number, name: p.name as string, slug: p.slug as string,
                  sub: (p.sub as string) ?? "", price_cents: p.price_cents as number, stock: p.stock as number,
                }} />
              ))}
            </div>
          ) : <div className="empty">No products match — try clearing a filter.</div>}
        </div>
      </div>
    </>
  );
}
