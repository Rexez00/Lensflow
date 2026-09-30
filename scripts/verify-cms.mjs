import { chromium } from "playwright";
const BASE = "http://127.0.0.1:3100";
let n = 0;
const ok = (name, cond) => { n++; if (!cond) throw new Error("FAILED: " + name); console.log("ok:", name); };
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

// PART 1: real photos, badges
await page.goto(BASE + "/products");
const imgs = await page.locator(".pcard img[src*='unsplash']").count();
ok(`product cards show photos (${imgs})`, imgs >= 6);
ok("badge rendered", await page.getByText("Bestseller").first().count() > 0);
await page.goto(BASE + "/product/macro-pro");
ok("gallery photo", await page.locator(".gal-main img[src*='unsplash']").count() > 0);
// cart drawer thumb
await page.goto(BASE + "/products");
await page.locator(".pcard", { hasText: "Fish Eye Lens 180°" }).locator(".addbtn").click();
await page.waitForFunction(() => document.querySelector("[data-cart-count]")?.textContent?.trim() === "1");
await page.click("[aria-label='Cart']");
await page.waitForTimeout(800);
ok("drawer photo", await page.locator(".drawer img[src*='unsplash']").count() > 0);
await page.keyboard.press("Escape");

// PART 2: admin login
const actx = await browser.newContext();
const admin = await actx.newPage();
admin.on("dialog", (d) => d.accept());
await admin.goto(BASE + "/admin");
await admin.waitForURL("**/login*");
await admin.fill('input[name="email"]', "admin@lensflow.shop");
await admin.fill('input[name="password"]', "admin123");
await Promise.all([admin.waitForURL("**/admin"), admin.click('button:has-text("Sign in")')]);
// search + low stock filter
await admin.goto(BASE + "/admin/products");
await admin.fill("input[placeholder='Search products…']", "duo-kit");
await admin.waitForTimeout(400);
ok("admin search filters", (await admin.locator("table tbody tr", { hasText: "duo-kit" }).count()) === 1);
await admin.fill("input[placeholder='Search products…']", "");
await admin.check("text=Low stock only");
await admin.waitForTimeout(400);
const lowRows = await admin.locator("table tbody tr").count();
ok(`low-stock filter (${lowRows} rows)`, lowRows >= 1);
await admin.uncheck("text=Low stock only");
// quick stock +1 on first row, verify count changes in DB-backed UI
const stockCell = admin.locator("table tbody tr >> nth=0 >> td >> nth=2 >> b");
const before = Number(await stockCell.innerText());
await admin.locator("table tbody tr >> nth=0 >> button:has-text('+')").click();
await admin.waitForFunction((exp) => document.querySelector("table tbody tr td:nth-child(3) b")?.textContent == String(exp), before + 1);
ok(`quick stock ${before} -> ${before + 1}`, true);
// create product with image + badge + featured (unique slug per run)
const STAMP = Date.now().toString(36);
const CMS_SLUG = `cms-verify-${STAMP}`;
await admin.click("button:has-text('+ New product')");
await admin.fill('input[name="name"]', "CMS Verify Lens");
await admin.fill('input[name="slug"]', CMS_SLUG);
await admin.fill('input[name="image_url"]', "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80");
await admin.fill('input[name="badge"]', "New");
await admin.fill('input[name="price"]', "12");
await admin.fill('input[name="stock"]', "7");
await admin.check('input[name="featured"]');
await Promise.all([admin.waitForLoadState("load"), admin.click('#pform button:has-text("Save product")')]);
await seen(admin, CMS_SLUG);
await page.goto(BASE + "/products");
await seen(page, "CMS Verify Lens");
ok("new product with photo live", await page.locator(".pcard:has-text('CMS Verify Lens') img[src*='unsplash']").count() > 0);
await page.goto(BASE + "/");
await seen(page, "CMS Verify Lens");
ok("featured shows on homepage", true);
// duplicate + unfeature + delete cleanup
await admin.goto(BASE + "/admin/products");
await admin.fill("input[placeholder='Search products…']", CMS_SLUG.slice(0, 18));
await admin.waitForTimeout(400);
await admin.click("button[title='Toggle homepage feature']");
await admin.click("button:has-text('⧉')");
await admin.waitForTimeout(1500);
const dupes = await admin.locator("table tbody tr", { hasText: CMS_SLUG.slice(0, 18) }).count();
ok(`duplicated as hidden (${dupes} rows)`, dupes === 2);

// PART 3: design CMS
async function publishAndWaitFor(text) {
  await admin.click('button:has-text("Publish changes")');
  for (let i = 0; i < 8; i++) {
    await page.goto(BASE + "/");
    if ((await page.getByText(text).count()) > 0) return;
    await page.waitForTimeout(1500);
  }
  throw new Error("publish not reflected: " + text);
}
await admin.goto(BASE + "/admin/design");
await seen(admin, "Canva-style editor");
await admin.fill('textarea[name="hero_title"]', "Shoot\nlike a pro");
await admin.fill('input[name="hero_cta_text"]', "Get Lenses");
await admin.fill('input[name="announcement"]', "VERIFY ANNOUNCE");
await admin.click('button[title="#EF4444"]');
await publishAndWaitFor("VERIFY ANNOUNCE");
await seen(page, "like a pro");
await seen(page, "Get Lenses");
ok("design publish updates storefront instantly", true);
// restore defaults
await admin.goto(BASE + "/admin/design");
await admin.fill('textarea[name="hero_title"]', "Unleash\nyour creativity");
await admin.fill('input[name="hero_cta_text"]', "Shop Now");
await admin.fill('input[name="announcement"]', "Free tracked shipping on every lens order");
await admin.click('button[title="#7C2DFF"]');
await admin.click('button:has-text("Publish changes")');
for (let i = 0; i < 8; i++) {
  await page.goto(BASE + "/");
  if ((await page.getByText("Free tracked shipping on every lens order").count()) > 0) break;
  await page.waitForTimeout(1500);
}
// cleanup all CMS test rows (this run + any leftovers)
await admin.goto(BASE + "/admin/products");
await admin.fill("input[placeholder='Search products…']", "cms-verify");
await admin.waitForTimeout(400);
for (let i = 0; i < 12; i++) {
  const btn = admin.locator("#product-table tbody tr >> nth=0 >> button:has-text('🗑')");
  if ((await btn.count()) === 0) break;
  await btn.click();
  await admin.waitForTimeout(900);
}
ok("cleanup done", true);

// PART 4: mobile
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await mctx.addCookies(await actx.cookies());
const m = await mctx.newPage();
await m.goto(BASE + "/");
await seen(m, "Unleash");
ok("mobile homepage", true);
await m.goto(BASE + "/admin/design");
await m.waitForTimeout(500);
const wrapBox = await m.locator(".design-wrap").boundingBox();
ok("design stacks on mobile", wrapBox && wrapBox.width < 420);

await browser.close();
console.log(`\nALL ${n} CMS CHECKS PASSED`);

async function seen(pg, text) {
  await pg.getByText(text).first().waitFor({ timeout: 12000 });
}
