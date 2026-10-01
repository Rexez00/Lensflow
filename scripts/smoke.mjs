const BASE = process.env.SMOKE_URL || "http://127.0.0.1:3101";
async function get(p, opts) {
  const r = await fetch(BASE + p, opts);
  const t = await r.text();
  return { status: r.status, body: t };
}
for (let i = 0; i < 30; i++) {
  try {
    const r = await get("/");
    if (r.status === 200 && r.body.includes("Unleash")) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 3000));
  if (i === 29) throw new Error("dev server did not come up");
}
const checks = [];
const home = await get("/");
checks.push(["home 200 + hero", home.status === 200 && home.body.includes("Unleash")]);
const prods = await get("/api/products?limit=2");
const pj = JSON.parse(prods.body);
// Empty-store spec: catalog starts at zero; API shape (items/total/pages) must hold regardless.
checks.push(["api products shape", prods.status === 200 && Array.isArray(pj.items) && typeof pj.total === "number" && !!pj.pages]);
const det = await get("/api/products/macro-pro");
if (pj.total > 0) {
  const dj = JSON.parse(det.body);
  checks.push(["api product detail variants+images", det.status === 200 && dj.variants.length >= 2 && dj.images.length >= 1]);
} else {
  checks.push(["api product detail 404 on empty catalog", det.status === 404]);
}
const miss = await get("/api/products/no-such-thing");
checks.push(["api missing 404", miss.status === 404]);
const ship = await get("/api/shipping");
const sj = JSON.parse(ship.body);
checks.push(["api shipping methods", ship.status === 200 && sj.length >= 3]);
const cart = await get("/api/cart");
checks.push(["api cart", cart.status === 200]);
const pdp = await get("/product/macro-pro");
if (pj.total > 0) {
  checks.push(["pdp renders w/ variants", pdp.status === 200 && pdp.body.includes("With calibration chart")]);
} else {
  checks.push(["pdp 404 on empty catalog", pdp.status === 404]);
}
const missPage = await get("/product/no-such-thing");
checks.push(["missing product 404", missPage.status === 404]);
const listing = await get("/products");
checks.push(["listing renders", listing.status === 200 && listing.body.includes(">Shop<") && listing.body.includes("MAD")]);
if (pj.total === 0) {
  checks.push(["listing empty state", listing.body.includes("being stocked")]);
}
const co = await get("/checkout");
checks.push(["checkout redirects to cart when empty (307/empty)", [200, 307].includes(co.status)]);
let fail = 0;
for (const [n, ok] of checks) {
  console.log((ok ? "ok: " : "FAIL: ") + n);
  if (!ok) fail++;
}
if (fail) process.exit(1);
console.log("SMOKE PASSED");
