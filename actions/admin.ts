"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db , type Row} from "@/lib/db";

async function admin() {
  const s = await auth();
  const role = (s?.user as { role?: string } | undefined)?.role;
  if (!s?.user || role !== "admin") throw new Error("forbidden");
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "item";

export async function setOrderStatus(id: number, status: string) {
  await admin();
  if (!["pending", "paid", "completed", "refunded", "cancelled"].includes(status)) return;
  await db()`UPDATE orders SET status = ${status} WHERE id = ${id}`;
  revalidatePath("/admin/orders");
}

export async function saveProduct(form: FormData) {
  await admin();
  const id = Number(form.get("id") || 0);
  const name = String(form.get("name") || "").slice(0, 120);
  let slug = String(form.get("slug") || slugify(name)).slice(0, 120);
  slug = slugify(slug);
  const price = Math.max(0, Math.round(Number(form.get("price") || 0) * 100));
  const oldRaw = Number(form.get("old") || 0);
  const old = oldRaw > 0 ? Math.round(oldRaw * 100) : null;
  const catId = Number(form.get("cat_id") || 0) || null;
  const stock = Math.max(0, Number(form.get("stock") || 0));
  const active = form.get("active") ? true : false;
  const featured = form.get("featured") ? true : false;
  const image_url = String(form.get("image_url") || "").slice(0, 1000);
  const badge = String(form.get("badge") || "").slice(0, 40);
  if (!name || !slug) return;
  const sql = db();
  if (id) {
    await sql`UPDATE products SET name=${name}, slug=${slug}, sub=${String(form.get("sub") || "")},
      price_cents=${price}, old_cents=${old}, cat_id=${catId}, stock=${stock},
      description=${String(form.get("description") || "")}, active=${active},
      image_url=${image_url}, badge=${badge}, featured=${featured} WHERE id=${id}`;
  } else {
    await sql`INSERT INTO products(name, slug, sub, price_cents, old_cents, cat_id, stock, description, active, image_url, badge, featured)
      VALUES(${name}, ${slug}, ${String(form.get("sub") || "")}, ${price}, ${old}, ${catId}, ${stock}, ${String(form.get("description") || "")}, ${active}, ${image_url}, ${badge}, ${featured})`;
  }
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function deleteProduct(id: number) {
  await admin();
  await db()`DELETE FROM products WHERE id = ${id}`;
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
}

export async function duplicateProduct(id: number) {
  await admin();
  const sql = db();
  const rows = (await sql`SELECT * FROM products WHERE id = ${id}`) as Row[];
  const p = rows[0];
  if (!p) return;
  const copySlug = slugify(String(p.slug) + "-copy-" + Date.now().toString(36));
  await sql`INSERT INTO products(name, slug, sub, price_cents, old_cents, cat_id, stock, description, active, image_url, badge, featured)
    VALUES(${(String(p.name) + " (copy)").slice(0, 120)}, ${copySlug}, ${String(p.sub ?? "")}, ${p.price_cents as number}, ${p.old_cents as number | null}, ${p.cat_id as number | null}, ${p.stock as number}, ${String(p.description ?? "")}, FALSE, ${String((p as Row).image_url ?? "")}, ${String((p as Row).badge ?? "")}, FALSE)`;
  revalidatePath("/admin/products");
}

export async function toggleFeatured(id: number) {
  await admin();
  await db()`UPDATE products SET featured = NOT featured WHERE id = ${id}`;
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function quickStock(id: number, stock: number) {
  await admin();
  await db()`UPDATE products SET stock = ${Math.max(0, stock)} WHERE id = ${id}`;
  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function saveCategory(form: FormData) {
  await admin();
  const name = String(form.get("name") || "").slice(0, 80);
  if (!name) return;
  await db()`INSERT INTO categories(name, slug) VALUES(${name}, ${slugify(name)}) ON CONFLICT DO NOTHING`;
  revalidatePath("/admin/categories");
}

export async function deleteCategory(id: number) {
  await admin();
  await db()`DELETE FROM categories WHERE id = ${id}`;
  revalidatePath("/admin/categories");
}

export async function approveReview(id: number) {
  await admin();
  const sql = db();
  await sql`UPDATE reviews SET approved = TRUE WHERE id = ${id}`;
  const r = await sql`SELECT product_id FROM reviews WHERE id = ${id}`;
  const pid = (r[0] as Row | undefined)?.product_id as number | null;
  if (pid) {
    const agg = (await sql`SELECT AVG(stars)::float AS a, COUNT(*)::int AS c FROM reviews WHERE product_id = ${pid} AND approved = TRUE`)[0] as Row;
    await sql`UPDATE products SET rating = ${Number(agg.a ?? 5).toFixed(1)}, rating_count = ${agg.c} WHERE id = ${pid}`;
  }
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
}

export async function deleteReview(id: number) {
  await admin();
  await db()`DELETE FROM reviews WHERE id = ${id}`;
  revalidatePath("/admin/reviews");
}

export async function adminReplyTicket(tid: number, form: FormData) {
  await admin();
  const s = await auth();
  const uid = Number((s?.user as { id?: string })?.id);
  const text = String(form.get("text") || "").slice(0, 4000);
  if (!text) redirect(`/admin/tickets/${tid}`);
  await db()`INSERT INTO messages(ticket_id, user_id, is_admin, text) VALUES(${tid}, ${uid}, TRUE, ${text})`;
  await db()`UPDATE tickets SET status = 'open' WHERE id = ${tid}`;
  redirect(`/admin/tickets/${tid}`);
}

export async function setTicketStatus(tid: number, status: string) {
  await admin();
  if (!["open", "awaiting", "closed"].includes(status)) return;
  await db()`UPDATE tickets SET status = ${status} WHERE id = ${tid}`;
  revalidatePath(`/admin/tickets/${tid}`);
}

export async function savePost(form: FormData) {
  await admin();
  const id = Number(form.get("id") || 0);
  const title = String(form.get("title") || "").slice(0, 200);
  const slug = String(form.get("slug") || slugify(title)).slice(0, 120);
  if (!title) return;
  if (id) {
    await db()`UPDATE posts SET slug=${slug}, title=${title}, excerpt=${String(form.get("excerpt") || "")}, body=${String(form.get("body") || "")} WHERE id=${id}`;
  } else {
    await db()`INSERT INTO posts(slug, title, excerpt, body) VALUES(${slug}, ${title}, ${String(form.get("excerpt") || "")}, ${String(form.get("body") || "")})`;
  }
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog");
}

export async function deletePost(id: number) {
  await admin();
  await db()`DELETE FROM posts WHERE id = ${id}`;
  revalidatePath("/admin/blog");
}

export async function saveCoupon(form: FormData) {
  await admin();
  const code = String(form.get("code") || "").trim().toUpperCase().slice(0, 32);
  const pct = Math.max(1, Math.min(90, Number(form.get("pct") || 10)));
  const min = Math.max(0, Math.round(Number(form.get("min") || 0) * 100));
  if (!code) return;
  await db()`INSERT INTO coupons(code, pct, active, min_cents) VALUES(${code}, ${pct}, TRUE, ${min}) ON CONFLICT DO NOTHING`;
  revalidatePath("/admin/coupons");
}

export async function toggleCoupon(id: number) {
  await admin();
  await db()`UPDATE coupons SET active = NOT active WHERE id = ${id}`;
  revalidatePath("/admin/coupons");
}

export async function deleteCoupon(id: number) {
  await admin();
  await db()`DELETE FROM coupons WHERE id = ${id}`;
  revalidatePath("/admin/coupons");
}

export async function payoutDecision(id: number, approve: boolean) {
  await admin();
  const sql = db();
  await sql.begin(async (tx) => {
    const rows = (await tx`SELECT * FROM affiliate_payouts WHERE id = ${id}`) as Row[];
    const p = rows[0];
    if (!p || p.status !== "pending") return;
    if (approve) {
      const u = (await tx`SELECT balance_cents FROM users WHERE id = ${p.user_id}`) as Row[];
      if (!u[0] || (u[0].balance_cents as number) < (p.amount_cents as number)) return;
      await tx`UPDATE users SET balance_cents = balance_cents - ${p.amount_cents} WHERE id = ${p.user_id}`;
      await tx`INSERT INTO transactions(user_id, kind, label, amount_cents) VALUES(${p.user_id}, 'payout', 'Affiliate payout', ${-(p.amount_cents as number)})`;
      await tx`UPDATE affiliate_payouts SET status = 'approved' WHERE id = ${id}`;
    } else {
      await tx`UPDATE affiliate_payouts SET status = 'rejected' WHERE id = ${id}`;
    }
  });
  revalidatePath("/admin/payouts");
}

export async function resellerDecision(id: number, approve: boolean) {
  await admin();
  await db()`UPDATE users SET reseller_status = ${approve ? "approved" : "none"} WHERE id = ${id}`;
  revalidatePath("/admin/resellers");
}

export async function saveVariant(form: FormData) {
  await admin();
  const productId = Number(form.get("product_id") || 0);
  const name = String(form.get("name") || "").trim().slice(0, 80);
  if (!productId || !name) return;
  const priceRaw = String(form.get("price") || "").trim();
  const stockRaw = String(form.get("stock") || "").trim();
  const price = priceRaw === "" ? null : Math.max(0, Math.round(Number(priceRaw) * 100));
  const stock = stockRaw === "" ? null : Math.max(0, Number(stockRaw));
  const sku = String(form.get("sku") || "").slice(0, 60);
  await db()`INSERT INTO product_variants(product_id, name, sku, price_cents, stock)
    VALUES(${productId}, ${name}, ${sku}, ${price}, ${stock})
    ON CONFLICT(product_id, name) DO UPDATE SET sku = EXCLUDED.sku, price_cents = EXCLUDED.price_cents, stock = EXCLUDED.stock`;
  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function deleteVariant(id: number) {
  await admin();
  await db()`DELETE FROM product_variants WHERE id = ${id}`;
  revalidatePath("/admin/products");
}

export async function saveImage(form: FormData) {
  await admin();
  const productId = Number(form.get("product_id") || 0);
  const url = String(form.get("url") || "").trim().slice(0, 1000);
  if (!productId || !url) return;
  const pos = Number(form.get("position") || 0);
  await db()`INSERT INTO product_images(product_id, url, position) VALUES(${productId}, ${url}, ${pos})`;
  revalidatePath("/admin/products");
}

export async function deleteImage(id: number) {
  await admin();
  await db()`DELETE FROM product_images WHERE id = ${id}`;
  revalidatePath("/admin/products");
}

export async function saveShippingMethod(form: FormData) {
  await admin();
  const name = String(form.get("name") || "").trim().slice(0, 80);
  if (!name) return;
  const description = String(form.get("description") || "").slice(0, 200);
  const price = Math.max(0, Math.round(Number(form.get("price") || 0) * 100));
  const eta = String(form.get("eta") || "").slice(0, 60);
  await db()`INSERT INTO shipping_methods(name, description, price_cents, eta, active, position)
    VALUES(${name}, ${description}, ${price}, ${eta}, TRUE, 0)
    ON CONFLICT DO NOTHING`;
  // Upsert by name (no unique constraint guaranteed on old DBs — update if exists).
  await db()`UPDATE shipping_methods SET description = ${description}, price_cents = ${price}, eta = ${eta} WHERE name = ${name}`;
  revalidatePath("/admin/shipping");
  revalidatePath("/checkout");
}

export async function toggleShipping(id: number) {
  await admin();
  await db()`UPDATE shipping_methods SET active = NOT active WHERE id = ${id}`;
  revalidatePath("/admin/shipping");
}

export async function deleteShipping(id: number) {
  await admin();
  await db()`DELETE FROM shipping_methods WHERE id = ${id}`;
  revalidatePath("/admin/shipping");
}

export async function toggleShippingForm(form: FormData) {
  await toggleShipping(Number(form.get("id") || 0));
}

export async function deleteShippingForm(form: FormData) {
  await deleteShipping(Number(form.get("id") || 0));
}

export async function deleteVariantForm(form: FormData) {
  await deleteVariant(Number(form.get("id") || 0));
}

export async function deleteImageForm(form: FormData) {
  await deleteImage(Number(form.get("id") || 0));
}

export async function saveSettings(form: FormData) {
  await admin();
  const sql = db();
  const pairs: [string, string][] = [
    ["store_name", String(form.get("store_name") || "Simple Lens").slice(0, 80)],
    ["announcement", String(form.get("announcement") || "").slice(0, 200)],
    ["contact_email", String(form.get("contact_email") || "").slice(0, 120)],
    ["contact_phone", String(form.get("contact_phone") || "").slice(0, 40)],
    ["currency", "MAD"],
    ["maintenance", form.get("maintenance") ? "1" : "0"],
  ];
  for (const [k, v] of pairs) {
    await sql`INSERT INTO settings(key, value) VALUES(${k}, ${v}) ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value`;
  }
  revalidatePath("/");
  redirect("/admin/settings");
}

const DESIGN_KEYS = [
  "store_name", "announcement", "logo_url",
  "hero_title", "hero_subtitle", "hero_cta_text",
  "hero_image_url", "hero_image_emoji",
  "trust_1", "trust_2", "trust_3",
  "footer_tagline", "accent_color", "featured_title",
] as const;

export async function saveDesign(form: FormData) {
  await admin();
  const sql = db();
  const get = (k: string, max = 500) => String(form.get(k) || "").slice(0, max);
  const pairs: [string, string][] = [
    ["store_name", get("store_name", 80) || "Simple Lens"],
    ["announcement", get("announcement", 200)],
    ["logo_url", get("logo_url", 1000)],
    ["hero_title", get("hero_title", 200) || "Unleash\nyour creativity"],
    ["hero_subtitle", get("hero_subtitle", 500)],
    ["hero_cta_text", get("hero_cta_text", 40) || "Shop Now"],
    ["hero_image_url", get("hero_image_url", 1000)],
    ["hero_image_emoji", get("hero_image_emoji", 10) || "📷"],
    ["trust_1", get("trust_1", 80)],
    ["trust_2", get("trust_2", 80)],
    ["trust_3", get("trust_3", 80)],
    ["footer_tagline", get("footer_tagline", 200)],
    ["accent_color", get("accent_color", 20) || "#7C2DFF"],
    ["featured_title", get("featured_title", 80) || "Featured Lenses"],
  ];
  for (const [k, v] of pairs) {
    await sql`INSERT INTO settings(key, value) VALUES(${k}, ${v}) ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value`;
  }
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/design");
}
