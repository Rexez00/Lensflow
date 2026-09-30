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
  await sql`INSERT INTO settings(key, value) VALUES('currency', 'USD') ON CONFLICT DO NOTHING`;
  await sql`INSERT INTO settings(key, value) VALUES('cod_enabled', '1') ON CONFLICT DO NOTHING`;
}

if (alreadySeeded) {
  await backfillShopExtensions();
  console.log("database already seeded — shop extensions backfilled");
  await sql.end();
  process.exit(0);
}

const cats = [["Fisheye", "fisheye"], ["Macro", "macro"], ["Kits", "kits"], ["Accessories", "accessories"]];
for (const [name, slug] of cats) await sql`INSERT INTO categories(name, slug) VALUES(${name}, ${slug})`;
const catRows = await sql`SELECT id, slug FROM categories`;
const cat = Object.fromEntries(catRows.map((r) => [r.slug, r.id]));

const products = [
  ["Fish Eye Lens 180°", "fisheye-180", "Cool wide aesthetic", 1000, null, "fisheye", 34, "Sweeping distorted frames with that dreamy lo-fi vibe your feed loves. Clips onto almost any smartphone in seconds.", "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80", "", true],
  ["Macro Lens Pro", "macro-pro", "Professional close-ups", 1800, 2400, "macro", 21, "Zoom right into textures and tiny subjects with crisp professional macro close-ups. Includes calibration chart.", "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80", "New", true],
  ["0.67X Wide Lens", "wide-067", "Sweeping frames", 600, null, "fisheye", 58, "A gentle wide-angle stretch for landscapes, rooms and group shots — no curve, just more scene.", "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80", "", false],
  ["Fisheye + Macro Duo Kit", "duo-kit", "Both lenses, one case", 2400, 3400, "kits", 12, "Both signature lenses in a pocket hard-case with two universal clips. The complete PocketLens setup.", "https://images.unsplash.com/photo-1500634245200-e5245c7574ef?auto=format&fit=crop&w=800&q=80", "Bestseller", true],
  ["Universal Clip 2-Pack", "clip-pack", "Spare mounting clips", 400, null, "accessories", 120, "Spare universal clamps. Fits slim cases; works over most phones without removing the case.", "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?auto=format&fit=crop&w=800&q=80", "", false],
  ["Pocket Hard-Case", "pocket-case", "Travel protection", 800, 1000, "accessories", 0, "Crush-proof mini case with foam cut-outs for two lenses and a clip. Currently restocking.", "https://images.unsplash.com/photo-1519638831568-d9897f54ed69?auto=format&fit=crop&w=800&q=80", "", false],
];
for (const [name, slug, sub, price, old, cslug, stock, desc, img, badge, feat] of products) {
  await sql`INSERT INTO products(name, slug, sub, price_cents, old_cents, cat_id, stock, rating, rating_count, description, image_url, badge, featured)
    VALUES(${name}, ${slug}, ${sub}, ${price}, ${old}, ${cat[cslug]}, ${stock}, 4.8, 120, ${desc}, ${img}, ${badge}, ${feat})`;
}
const prodRows = await sql`SELECT id, name FROM products`;
const prod = Object.fromEntries(prodRows.map((r) => [r.name, r.id]));
const reviews = [
  ["Maya R.", 5, "The fisheye curve is perfect", "Clipped onto my phone in seconds and the wide curl looks straight out of a 90s skate video.", "Fish Eye Lens 180°"],
  ["Jonas K.", 5, "Macro is shockingly sharp", "I photograph watch dials and the detail is unreal for something this small.", "Macro Lens Pro"],
  ["Priya S.", 4, "Great, thick cases beware", "Works flawlessly on my slim case. Support answered within a day with a workaround.", "Fisheye + Macro Duo Kit"],
];
for (const [name, stars, title, text, pname] of reviews) {
  await sql`INSERT INTO reviews(product_id, name, stars, title, text, approved)
    VALUES(${prod[pname] ?? null}, ${name}, ${stars}, ${title}, ${text}, TRUE)`;
}
const posts = [
  ["fisheye-guide", "5 fisheye framings that always work", "Low angles, leading curves, centered subjects.", "Low angles exaggerate the curl. Center your subject and let the edges bend the scene around it."],
  ["macro-light", "Lighting tiny things with your phone", "A desk lamp and a piece of paper beat expensive gear.", "Side-light reveals texture; top-light flattens it. Bounce a desk lamp off white paper for soft fill."],
  ["care-kit", "Keeping pocket glass flawless", "Microfiber, blower, done.", "Blow first, wipe second — grit is what scratches coatings. Never use shirt sleeves."],
];
for (const [slug, title, excerpt, body] of posts) {
  await sql`INSERT INTO posts(slug, title, excerpt, body) VALUES(${slug}, ${title}, ${excerpt}, ${body})`;
}
await sql`INSERT INTO coupons(code, pct, active, min_cents) VALUES('SAVE10', 10, TRUE, 0)`;
await sql`INSERT INTO settings(key, value) VALUES('store_name', 'PocketLens') ON CONFLICT DO NOTHING`;
await sql`INSERT INTO settings(key, value) VALUES('announcement', 'Free tracked shipping on every lens order') ON CONFLICT DO NOTHING`;
await sql`INSERT INTO settings(key, value) VALUES('maintenance', '0') ON CONFLICT DO NOTHING`;
await sql`INSERT INTO settings(key, value) VALUES('currency', 'USD') ON CONFLICT DO NOTHING`;
await sql`INSERT INTO settings(key, value) VALUES('cod_enabled', '1') ON CONFLICT DO NOTHING`;
await sql`INSERT INTO users(email, pw_hash, name, role, affiliate_code) VALUES(
  ${process.env.ADMIN_EMAIL || "admin@lensflow.shop"},
  ${await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 12)}, 'Admin', 'admin', 'ADMIN')`;
await backfillShopExtensions();
console.log("seeded");
await sql.end();
