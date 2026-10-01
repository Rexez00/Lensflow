import postgres from "postgres";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const sql = postgres(url, { max: 1 });

const existing = await sql`SELECT COUNT(*)::int AS c FROM users`;
const alreadySeeded = existing[0].c > 0;

async function backfillShopExtensions() {
  await sql`
    CREATE TABLE IF NOT EXISTS product_variants(
      id SERIAL PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      name TEXT NOT NULL, sku TEXT DEFAULT '', price_cents INTEGER, stock INTEGER,
      active BOOLEAN NOT NULL DEFAULT TRUE, position INTEGER NOT NULL DEFAULT 0,
      UNIQUE(product_id, name))`;
  await sql`
    CREATE TABLE IF NOT EXISTS product_images(
      id SERIAL PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      url TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0)`;
  await sql`
    CREATE TABLE IF NOT EXISTS shipping_methods(
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, description TEXT DEFAULT '',
      price_cents INTEGER NOT NULL DEFAULT 0, eta TEXT DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT TRUE, position INTEGER NOT NULL DEFAULT 0)`;
  const prods = await sql`SELECT id, slug, name, price_cents, image_url FROM products`;
  const bySlug = Object.fromEntries(prods.map((r) => [r.slug, r]));
  const variantSets = {
    "fisheye-180": [["Standard", null, null], ["With spare clip", 400, null], ["Gift wrapped", 200, null]],
    "macro-pro": [["Standard", null, null], ["With calibration chart", 0, null], ["Gift wrapped", 200, null]],
    "wide-067": [["Standard", null, null], ["With spare clip", 300, null]],
    "duo-kit": [["Standard", null, null], ["Gift wrapped", 200, null]],
    "clip-pack": [["Standard", null, null], ["4-pack", 300, null]],
    "pocket-case": [["Standard", null, null]],
  };
  for (const [slug, vars] of Object.entries(variantSets)) {
    const p = bySlug[slug];
    if (!p) continue;
    let pos = 0;
    for (const [name, delta, stock] of vars) {
      const price = delta == null ? null : p.price_cents + delta;
      await sql`INSERT INTO product_variants(product_id, name, price_cents, stock, position)
        VALUES(${p.id}, ${name}, ${price}, ${stock}, ${pos++})
        ON CONFLICT(product_id, name) DO UPDATE SET price_cents = EXCLUDED.price_cents`;
    }
  }
  const galleryExtra = {
    "fisheye-180": ["https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80"],
    "macro-pro": ["https://images.unsplash.com/photo-1500634245200-e5245c7574ef?auto=format&fit=crop&w=800&q=80"],
    "duo-kit": ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80"],
  };
  for (const [slug, urls] of Object.entries(galleryExtra)) {
    const p = bySlug[slug];
    if (!p) continue;
    if (p.image_url) {
      await sql`INSERT INTO product_images(product_id, url, position)
        SELECT ${p.id}, ${p.image_url}, 0 WHERE NOT EXISTS
        (SELECT 1 FROM product_images WHERE product_id = ${p.id} AND url = ${p.image_url})`;
    }
    let pos = 1;
    for (const u of urls) {
      await sql`INSERT INTO product_images(product_id, url, position)
        SELECT ${p.id}, ${u}, ${pos++} WHERE NOT EXISTS
        (SELECT 1 FROM product_images WHERE product_id = ${p.id} AND url = ${u})`;
    }
  }
  const ships = [
    ["Standard", "Tracked 3–5 business days", 0, "3–5 days", 0],
    ["Express", "Priority 1–2 business days", 690, "1–2 days", 1],
    ["Pickup", "Free pickup in store", 0, "Same day", 2],
  ];
  for (const [name, desc, price, eta, pos] of ships) {
    const found = await sql`SELECT id FROM shipping_methods WHERE name = ${name}`;
    if (!found[0]) await sql`INSERT INTO shipping_methods(name, description, price_cents, eta, position) VALUES(${name}, ${desc}, ${price}, ${eta}, ${pos})`;
  }
  await sql`INSERT INTO settings(key, value) VALUES('currency', 'MAD') ON CONFLICT DO NOTHING`;
  await sql`INSERT INTO settings(key, value) VALUES('cod_enabled', '1') ON CONFLICT DO NOTHING`;
  // Keep the store currency pinned to MAD even on databases seeded earlier.
  await sql`UPDATE settings SET value = 'MAD' WHERE key = 'currency'`;
  // Brand migration for databases seeded under the old name.
  await sql`UPDATE settings SET value = 'Simple Lens' WHERE key = 'store_name' AND value IN ('PocketLens', 'LensFlow', 'Lensflow')`;
}

if (alreadySeeded) {
  await backfillShopExtensions();
  console.log("database already seeded — shop extensions backfilled");
  await sql.end();
  process.exit(0);
}

const cats = [["Fisheye", "fisheye"], ["Macro", "macro"], ["Kits", "kits"], ["Accessories", "accessories"]];
for (const [name, slug] of cats) await sql`INSERT INTO categories(name, slug) VALUES(${name}, ${slug})`;

// NOTE: the catalog intentionally starts EMPTY — no demo products, no fake
// reviews, no fake orders. The store owner adds real products via /admin.
// (An older version of this script seeded sample products; that block was
// removed so fresh installs comply with the empty-store requirement.)
await sql`INSERT INTO settings(key, value) VALUES('store_name', 'Simple Lens') ON CONFLICT DO NOTHING`;
await sql`INSERT INTO settings(key, value) VALUES('announcement', 'Free tracked shipping across Morocco on every lens order') ON CONFLICT DO NOTHING`;
await sql`INSERT INTO settings(key, value) VALUES('maintenance', '0') ON CONFLICT DO NOTHING`;
await sql`INSERT INTO settings(key, value) VALUES('currency', 'MAD') ON CONFLICT DO NOTHING`;
await sql`INSERT INTO settings(key, value) VALUES('cod_enabled', '1') ON CONFLICT DO NOTHING`;
await sql`INSERT INTO users(email, pw_hash, name, role, affiliate_code) VALUES(
  ${process.env.ADMIN_EMAIL || "admin@lensflow.shop"},
  ${await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 12)}, 'Admin', 'admin', 'ADMIN')`;
await backfillShopExtensions();
console.log("seeded");
await sql.end();
