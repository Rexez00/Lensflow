import { NextResponse } from "next/server";
import { db, type Row } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/products/:slug — detail with real variants + gallery images. */
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const sql = db();
    const rows = (await sql`SELECT p.*, c.slug AS cat_slug, c.name AS cat_name FROM products p
      LEFT JOIN categories c ON c.id = p.cat_id
      WHERE p.slug = ${params.slug} AND p.active = TRUE`) as Row[];
    const p = rows[0];
    if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });
    let variants: Row[] = [];
    let images: Row[] = [];
    try {
      variants = (await sql`SELECT * FROM product_variants WHERE product_id = ${p.id} AND active = TRUE ORDER BY position, id`) as Row[];
    } catch { variants = []; }
    try {
      images = (await sql`SELECT url FROM product_images WHERE product_id = ${p.id} ORDER BY position, id`) as Row[];
    } catch { images = []; }
    const gallery = [
      ...images.map((r) => String(r.url)).filter(Boolean),
      String(p.image_url ?? ""),
    ].filter(Boolean);
    return NextResponse.json({
      product: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        sub: p.sub ?? "",
        price_cents: p.price_cents,
        old_cents: p.old_cents ?? null,
        stock: p.stock,
        rating: Number(p.rating ?? 5),
        rating_count: p.rating_count,
        description: p.description ?? "",
        image_url: p.image_url ?? "",
        badge: p.badge ?? "",
        featured: !!p.featured,
        cat_slug: (p.cat_slug as string | null) ?? null,
        cat_name: (p.cat_name as string | null) ?? null,
      },
      variants: variants.map((v) => {
        const price = (v.price_cents as number | null) ?? (p.price_cents as number);
        const stock = (v.stock as number | null) ?? (p.stock as number);
        return {
          id: v.id,
          name: String(v.name),
          sku: String(v.sku ?? ""),
          price_cents: v.price_cents as number | null,
          stock: v.stock as number | null,
          effective_price: price,
          effective_stock: stock,
        };
      }),
      images: [...new Set(gallery)],
    });
  } catch (e) {
    console.error("PRODUCT_DETAIL_API_FAIL", e);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
