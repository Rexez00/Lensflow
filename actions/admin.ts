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
  const slug = String(form.get("slug") || slugify(name)).slice(0, 120);
  const price = Math.max(0, Math.round(Number(form.get("price") || 0) * 100));
  const oldRaw = Number(form.get("old") || 0);
  const old = oldRaw > 0 ? Math.round(oldRaw * 100) : null;
  const catId = Number(form.get("cat_id") || 0) || null;
  const stock = Math.max(0, Number(form.get("stock") || 0));
  const active = form.get("active") ? true : false;
  if (!name || !slug) return;
  const sql = db();
  if (id) {
    await sql`UPDATE products SET name=${name}, slug=${slug}, sub=${String(form.get("sub") || "")},
      price_cents=${price}, old_cents=${old}, cat_id=${catId}, stock=${stock},
      description=${String(form.get("description") || "")}, active=${active} WHERE id=${id}`;
  } else {
    await sql`INSERT INTO products(name, slug, sub, price_cents, old_cents, cat_id, stock, description, active)
      VALUES(${name}, ${slug}, ${String(form.get("sub") || "")}, ${price}, ${old}, ${catId}, ${stock}, ${String(form.get("description") || "")}, ${active})`;
  }
  revalidatePath("/admin/products");
  revalidatePath("/products");
  redirect("/admin/products");
}

export async function deleteProduct(id: number) {
  await admin();
  await db()`DELETE FROM products WHERE id = ${id}`;
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

export async function saveSettings(form: FormData) {
  await admin();
  const sql = db();
  const pairs: [string, string][] = [
    ["store_name", String(form.get("store_name") || "PocketLens").slice(0, 80)],
    ["announcement", String(form.get("announcement") || "").slice(0, 200)],
    ["maintenance", form.get("maintenance") ? "1" : "0"],
  ];
  for (const [k, v] of pairs) {
    await sql`INSERT INTO settings(key, value) VALUES(${k}, ${v}) ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value`;
  }
  revalidatePath("/");
  redirect("/admin/settings");
}
