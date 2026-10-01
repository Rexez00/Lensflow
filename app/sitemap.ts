import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function base() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const b = base();
  const staticPages = ["", "/products", "/about", "/contact", "/faq", "/shipping", "/returns", "/privacy", "/legal", "/blog", "/reviews"].map(
    (p) => ({ url: b + (p || "/"), lastModified: new Date() })
  );
  try {
    const sql = db();
    const rows = (await sql`SELECT slug FROM products WHERE active = TRUE ORDER BY id DESC LIMIT 500`) as { slug: string }[];
    const products = rows.map((r) => ({ url: `${b}/product/${r.slug}`, lastModified: new Date() }));
    return [...staticPages, ...products];
  } catch {
    return staticPages;
  }
}
