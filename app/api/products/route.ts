import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/products?cat=&q=&min=&max=&stock=1&sort=&page=&limit= — real backend listing. */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const conds: string[] = ["p.active = TRUE"];
    const args: unknown[] = [];
    let i = 1;
    const push = (c: string, v: unknown) => {
      conds.push(c.replace(/\?/g, () => `$${i++}`));
      args.push(v);
    };
    const cat = sp.get("cat");
    const q = sp.get("q");
    const min = sp.get("min");
    const max = sp.get("max");
    if (cat) push("p.cat_id = (SELECT id FROM categories WHERE slug = ?)", cat);
    if (q) {
      push("(p.name ILIKE ? OR p.sub ILIKE ?)", `%${q}%`);
      args.push(`%${q}%`);
      i++;
    }
    if (min) push("p.price_cents >= ?", Math.round(Number(min) * 100));
    if (max) push("p.price_cents <= ?", Math.round(Number(max) * 100));
    if (sp.get("stock") === "1") conds.push("p.stock > 0");
    const sortKey = sp.get("sort") ?? "";
    const order =
      ({ lo: "p.price_cents", hi: "p.price_cents DESC", rate: "p.rating DESC" } as Record<string, string>)[sortKey] ??
      "p.rating_count DESC";
    const limit = Math.max(1, Math.min(60, Number(sp.get("limit") || 12)));
    const page = Math.max(1, Number(sp.get("page") || 1));
    const offset = (page - 1) * limit;
    const sql = db();
    const totalRows = (await sql.unsafe(
      `SELECT COUNT(*)::int AS c FROM products p WHERE ${conds.join(" AND ")}`,
      args as never[]
    )) as { c: number }[];
    const total = totalRows[0]?.c ?? 0;
    const items = (await sql.unsafe(
      `SELECT p.*, c.slug AS cat_slug, c.name AS cat_name FROM products p
       LEFT JOIN categories c ON c.id = p.cat_id
       WHERE ${conds.join(" AND ")} ORDER BY ${order} LIMIT $${i++} OFFSET $${i++}`,
      [...args, limit, offset] as never[]
    )) as Record<string, unknown>[];
    return NextResponse.json({
      items: items.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        sub: p.sub ?? "",
        price_cents: p.price_cents,
        old_cents: p.old_cents ?? null,
        stock: p.stock,
        rating: Number(p.rating ?? 5),
        rating_count: p.rating_count,
        image_url: p.image_url ?? "",
        badge: p.badge ?? "",
        featured: !!p.featured,
        cat_slug: (p.cat_slug as string | null) ?? null,
        cat_name: (p.cat_name as string | null) ?? null,
      })),
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      total,
    });
  } catch (e) {
    console.error("PRODUCTS_API_FAIL", e);
    return NextResponse.json({ items: [], page: 1, pages: 1, total: 0 }, { status: 503 });
  }
}
