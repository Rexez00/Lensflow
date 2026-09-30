import { db, type Row } from "@/lib/db";
import ProductManager from "@/components/ProductManager";
import ProductExtras from "@/components/ProductExtras";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  const sql = db();
  const rows = (await sql`SELECT p.*, c.name AS catname FROM products p LEFT JOIN categories c ON c.id = p.cat_id ORDER BY p.id`) as Row[];
  const cats = (await sql`SELECT id, name FROM categories`) as Row[];
  let variants: Row[] = [];
  let images: Row[] = [];
  try {
    variants = (await sql`SELECT v.*, p.name AS pname FROM product_variants v JOIN products p ON p.id = v.product_id ORDER BY v.product_id, v.position, v.id`) as Row[];
  } catch { variants = []; }
  try {
    images = (await sql`SELECT i.*, p.name AS pname FROM product_images i JOIN products p ON p.id = i.product_id ORDER BY i.product_id, i.position, i.id`) as Row[];
  } catch { images = []; }
  return (
    <>
      <h1 style={{ fontSize: 26 }}>Products</h1>
      <p style={{ color: "var(--sa-ink-soft)", fontSize: 14, margin: "6px 0 20px" }}>{rows.length} products. Edit, duplicate, feature on homepage — all live instantly.</p>
      <ProductManager
        prods={rows.map((p) => ({
          id: p.id as number, name: String(p.name), slug: String(p.slug), sub: String(p.sub ?? ""),
          price_cents: p.price_cents as number, old_cents: (p.old_cents as number | null) ?? null,
          cat_id: (p.cat_id as number | null) ?? null, catname: (p.catname as string | null) ?? null,
          stock: p.stock as number, description: String(p.description ?? ""), active: !!p.active,
          image_url: String((p as Row).image_url ?? ""), badge: String((p as Row).badge ?? ""),
          featured: !!((p as Row).featured ?? false),
        }))}
        cats={cats.map((c) => ({ id: c.id as number, name: String(c.name) }))}
      />
      <ProductExtras
        prods={rows.map((p) => ({ id: p.id as number, name: String(p.name), price_cents: p.price_cents as number }))}
        variants={variants.map((v) => ({
          id: v.id as number, product_id: v.product_id as number, pname: String(v.pname ?? ""),
          name: String(v.name), sku: String(v.sku ?? ""),
          price_cents: (v.price_cents as number | null) ?? null,
          stock: (v.stock as number | null) ?? null,
        }))}
        images={images.map((i) => ({
          id: i.id as number, product_id: i.product_id as number, pname: String(i.pname ?? ""),
          url: String(i.url), position: Number(i.position ?? 0),
        }))}
      />
    </>
  );
}
