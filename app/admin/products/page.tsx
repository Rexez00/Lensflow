import { db , type Row} from "@/lib/db";
import ProductManager from "@/components/ProductManager";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  const sql = db();
  const rows = (await sql`SELECT p.*, c.name AS catname FROM products p LEFT JOIN categories c ON c.id = p.cat_id ORDER BY p.id`) as Row[];
  const cats = (await sql`SELECT id, name FROM categories`) as Row[];
  return (
    <>
      <h1 style={{ fontSize: 26 }}>Products</h1>
      <p style={{ color: "var(--sa-ink-soft)", fontSize: 14, margin: "6px 0 20px" }}>{rows.length} products.</p>
      <ProductManager
        prods={rows.map((p) => ({
          id: p.id as number, name: String(p.name), slug: String(p.slug), sub: String(p.sub ?? ""),
          price_cents: p.price_cents as number, old_cents: (p.old_cents as number | null) ?? null,
          cat_id: (p.cat_id as number | null) ?? null, catname: (p.catname as string | null) ?? null,
          stock: p.stock as number, description: String(p.description ?? ""), active: !!p.active,
        }))}
        cats={cats.map((c) => ({ id: c.id as number, name: String(c.name) }))}
      />
    </>
  );
}
