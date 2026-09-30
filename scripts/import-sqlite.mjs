/** Import an existing Flask/SQLite store.db into Postgres. Keeps every row.
 *  Usage: SQLITE_PATH=../lensflow-app/store.db npm run db:import
 *  Requires Node 22+ (built-in node:sqlite). Safe to re-run: skips when
 *  the target database already holds users. */
import postgres from "postgres";
import { DatabaseSync } from "node:sqlite";
import { existsSync } from "fs";

const src = process.env.SQLITE_PATH || "../lensflow-app/store.db";
if (!existsSync(src)) throw new Error(`SQLite file not found: ${src}`);
const pgUrl = process.env.DATABASE_URL;
if (!pgUrl) throw new Error("DATABASE_URL is not set");

const lite = new DatabaseSync(src, { readOnly: true });
const sql = postgres(pgUrl, { max: 1 });
const already = await sql`SELECT COUNT(*)::int AS c FROM users`;
if (already[0].c > 0) {
  console.log("target database already has users — skipping import");
  await sql.end();
  process.exit(0);
}

const q = (t) => lite.prepare(`SELECT * FROM ${t}`).all();
const idMap = { users: new Map(), categories: new Map(), products: new Map(), orders: new Map(), tickets: new Map() };

for (const u of q("users")) {
  const r = await sql`INSERT INTO users(email, pw_hash, name, role, balance_cents, affiliate_code, referred_by, reseller_status, created)
    VALUES(${u.email}, ${u.pw_hash}, ${u.name}, ${u.role}, ${u.balance_cents}, ${u.affiliate_code}, NULL, ${u.reseller_status}, ${u.created}) RETURNING id`;
  idMap.users.set(u.id, r[0].id);
}
for (const u of q("users")) {
  if (u.referred_by && idMap.users.has(u.referred_by)) {
    await sql`UPDATE users SET referred_by = ${idMap.users.get(u.referred_by)} WHERE id = ${idMap.users.get(u.id)}`;
  }
}
for (const c of q("categories")) {
  const r = await sql`INSERT INTO categories(name, slug) VALUES(${c.name}, ${c.slug}) RETURNING id`;
  idMap.categories.set(c.id, r[0].id);
}
for (const p of q("products")) {
  const r = await sql`INSERT INTO products(name, slug, sub, price_cents, old_cents, cat_id, stock, rating, rating_count, description, active)
    VALUES(${p.name}, ${p.slug}, ${p.sub}, ${p.price_cents}, ${p.old_cents}, ${p.cat_id ? idMap.categories.get(p.cat_id) : null},
      ${p.stock}, ${p.rating}, ${p.rating_count}, ${p.description}, ${p.active === 1}) RETURNING id`;
  idMap.products.set(p.id, r[0].id);
}
for (const r of q("reviews")) {
  await sql`INSERT INTO reviews(product_id, user_id, name, stars, title, text, approved, created)
    VALUES(${r.product_id ? idMap.products.get(r.product_id) : null}, ${r.user_id ? idMap.users.get(r.user_id) : null},
      ${r.name}, ${r.stars}, ${r.title}, ${r.text}, ${r.approved === 1}, ${r.created})`;
}
for (const p of q("posts")) {
  await sql`INSERT INTO posts(slug, title, excerpt, body, created) VALUES(${p.slug}, ${p.title}, ${p.excerpt}, ${p.body}, ${p.created})`;
}
for (const c of q("coupons")) {
  await sql`INSERT INTO coupons(code, pct, active, min_cents) VALUES(${c.code}, ${c.pct}, ${c.active === 1}, ${c.min_cents})`;
}
for (const o of q("orders")) {
  const r = await sql`INSERT INTO orders(code, user_id, email, kind, subtotal_cents, discount_cents, total_cents, status, coupon, stripe_session, meta, created)
    VALUES(${o.code}, ${o.user_id ? idMap.users.get(o.user_id) : null}, ${o.email}, ${o.kind}, ${o.subtotal_cents}, ${o.discount_cents},
      ${o.total_cents}, ${o.status}, ${o.coupon}, ${o.stripe_session}, ${o.meta}, ${o.created}) RETURNING id`;
  idMap.orders.set(o.id, r[0].id);
}
for (const i of q("order_items")) {
  await sql`INSERT INTO order_items(order_id, product_id, name, variant, qty, price_cents)
    VALUES(${idMap.orders.get(i.order_id)}, ${i.product_id ? idMap.products.get(i.product_id) : null}, ${i.name}, ${i.variant}, ${i.qty}, ${i.price_cents})`;
}
for (const t of q("tickets")) {
  const r = await sql`INSERT INTO tickets(user_id, subject, order_id, status, created)
    VALUES(${idMap.users.get(t.user_id)}, ${t.subject}, ${t.order_id ? idMap.orders.get(t.order_id) : null}, ${t.status}, ${t.created}) RETURNING id`;
  idMap.tickets.set(t.id, r[0].id);
}
for (const m of q("messages")) {
  await sql`INSERT INTO messages(ticket_id, user_id, is_admin, text, created)
    VALUES(${idMap.tickets.get(m.ticket_id)}, ${m.user_id ? idMap.users.get(m.user_id) : null}, ${m.is_admin === 1}, ${m.text}, ${m.created})`;
}
for (const t of q("transactions")) {
  await sql`INSERT INTO transactions(user_id, kind, label, amount_cents, created)
    VALUES(${idMap.users.get(t.user_id)}, ${t.kind}, ${t.label}, ${t.amount_cents}, ${t.created})`;
}
for (const s of q("subscriptions")) {
  await sql`INSERT INTO subscriptions(user_id, plan, price_cents, interval, status, renews, created)
    VALUES(${idMap.users.get(s.user_id)}, ${s.plan}, ${s.price_cents}, ${s.interval}, ${s.status}, ${s.renews}, ${s.created})`;
}
for (const p of q("affiliate_payouts")) {
  await sql`INSERT INTO affiliate_payouts(user_id, amount_cents, details, status, created)
    VALUES(${idMap.users.get(p.user_id)}, ${p.amount_cents}, ${p.details}, ${p.status}, ${p.created})`;
}
for (const s of q("settings")) {
  await sql`INSERT INTO settings(key, value) VALUES(${s.key}, ${s.value}) ON CONFLICT(key) DO NOTHING`;
}
for (const seq of ["users", "categories", "products", "reviews", "posts", "coupons", "orders", "order_items", "tickets", "messages", "transactions", "subscriptions", "affiliate_payouts"]) {
  await sql.unsafe(`SELECT setval(pg_get_serial_sequence('${seq}','id'), (SELECT COALESCE(MAX(id)+1,1) FROM ${seq}), false)`);
}
console.log("import complete");
await sql.end();
