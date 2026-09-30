import postgres from "postgres";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const sql = postgres(url, { max: 1 });

const existing = await sql`SELECT COUNT(*)::int AS c FROM users`;
if (existing[0].c > 0) {
  console.log("database already seeded — skipping");
  await sql.end();
  process.exit(0);
}

const cats = [["Fisheye", "fisheye"], ["Macro", "macro"], ["Kits", "kits"], ["Accessories", "accessories"]];
for (const [name, slug] of cats) await sql`INSERT INTO categories(name, slug) VALUES(${name}, ${slug})`;
const catRows = await sql`SELECT id, slug FROM categories`;
const cat = Object.fromEntries(catRows.map((r) => [r.slug, r.id]));

const products = [
  ["Fish Eye Lens 180°", "fisheye-180", "Cool wide aesthetic", 1000, null, "fisheye", 34, "Sweeping distorted frames with that dreamy lo-fi vibe your feed loves. Clips onto almost any smartphone in seconds."],
  ["Macro Lens Pro", "macro-pro", "Professional close-ups", 1800, 2400, "macro", 21, "Zoom right into textures and tiny subjects with crisp professional macro close-ups. Includes calibration chart."],
  ["0.67X Wide Lens", "wide-067", "Sweeping frames", 600, null, "fisheye", 58, "A gentle wide-angle stretch for landscapes, rooms and group shots — no curve, just more scene."],
  ["Fisheye + Macro Duo Kit", "duo-kit", "Both lenses, one case", 2400, 3400, "kits", 12, "Both signature lenses in a pocket hard-case with two universal clips. The complete PocketLens setup."],
  ["Universal Clip 2-Pack", "clip-pack", "Spare mounting clips", 400, null, "accessories", 120, "Spare universal clamps. Fits slim cases; works over most phones without removing the case."],
  ["Pocket Hard-Case", "pocket-case", "Travel protection", 800, 1000, "accessories", 0, "Crush-proof mini case with foam cut-outs for two lenses and a clip. Currently restocking."],
];
for (const [name, slug, sub, price, old, cslug, stock, desc] of products) {
  await sql`INSERT INTO products(name, slug, sub, price_cents, old_cents, cat_id, stock, rating, rating_count, description)
    VALUES(${name}, ${slug}, ${sub}, ${price}, ${old}, ${cat[cslug]}, ${stock}, 4.8, 120, ${desc})`;
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
await sql`INSERT INTO users(email, pw_hash, name, role, affiliate_code) VALUES(
  ${process.env.ADMIN_EMAIL || "admin@lensflow.shop"},
  ${await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 12)}, 'Admin', 'admin', 'ADMIN')`;
console.log("seeded");
await sql.end();
