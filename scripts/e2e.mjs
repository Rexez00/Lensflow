/** Full browser end-to-end suite. Requires: Postgres migrated+seeded, server running.
 *  Usage: BASE_URL=http://127.0.0.1:3100 ADMIN_PASSWORD=admin123 node scripts/e2e.mjs
 *  Uses fresh throwaway customers; mutates the database (use a test DB). */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3100";
const ADMIN_PW = process.env.ADMIN_PASSWORD || "admin123";
const stamp = Date.now().toString(36);
const EMAIL = `e2e-${stamp}@x.shop`;
const PASS = "password123";
let n = 0;
const ok = (name, cond) => {
  n++;
  if (!cond) throw new Error("FAILED: " + name);
  console.log("ok:", name);
};
const seen = async (page, text) => {
  await page.getByText(text).first().waitFor({ timeout: 10000 });
  ok(`see "${text}"`, true);
};
const navClick = async (page, sel) => {
  await Promise.all([page.waitForNavigation({ timeout: 15000 }), page.click(sel)]);
};

const browser = await chromium.launch();
const cust = await browser.newContext();
const page = await cust.newPage();

// 1. storefront renders with real DB data
await page.goto(BASE + "/");
await seen(page, "Unleash");
ok("3 featured cards", (await page.locator(".feat .pcard").count()) === 3);
await page.goto(BASE + "/products?cat=fisheye");
await seen(page, "0.67X Wide Lens");
await page.goto(BASE + "/product/macro-pro");
ok("product page", (await page.getByRole("heading", { name: "Macro Lens Pro" }).count()) > 0);

// 2. register + dashboard
await page.goto(BASE + "/register");
await page.fill('input[name="name"]', "E2E");
await page.fill('input[name="email"]', EMAIL);
await page.fill('input[name="password"]', PASS);
await Promise.all([page.waitForURL("**/account"), page.click('button:has-text("Create account")')]);
ok("registered -> dashboard", page.url().includes("/account"));
await seen(page, "Completed orders");

// 3. cart: add from listing (triggers reload), stepper on cart page
await page.goto(BASE + "/products");
await page.locator(".pcard", { hasText: "Fish Eye Lens 180°" }).locator(".addbtn").click();
await page.waitForFunction(() => document.querySelector("[data-cart-count]")?.textContent?.trim() === "1");
await page.goto(BASE + "/cart");
await seen(page, "Fish Eye Lens 180°");
await page.click(".stepper button >> nth=1");
await page.waitForFunction(() => document.querySelector(".stepper b")?.textContent === "2");
ok("qty bumped to 2", true);

// 4. checkout with coupon, demopay, success
await page.goto(BASE + "/checkout");
await page.fill('input[name="coupon"]', "SAVE10");
await page.click('button:has-text("Apply")');
await seen(page, "SAVE10");
await Promise.all([page.waitForURL("**/pay/**"), page.click('button:has-text("Place order")')]);
const payUrl = page.url();
ok("pay page", /\/pay\/PL-/.test(payUrl));
await Promise.all([page.waitForURL("**/checkout/success**"), page.click('button:has-text("Simulate successful payment")')]);
await seen(page, "Payment successful");
const code = payUrl.match(/PL-\d+/)[0];

// 5. orders + balance top-up
await page.goto(BASE + "/account/orders");
await seen(page, code);
await page.goto(BASE + "/account/balance");
await page.fill('input[name="amount"]', "10");
await Promise.all([page.waitForURL("**/pay/**"), page.click('button:has-text("Continue to payment")')]);
await Promise.all([page.waitForURL("**/checkout/success**"), page.click('button:has-text("Simulate successful payment")')]);
await page.goto(BASE + "/account/balance");
await seen(page, "$10.00");

// 6. subscriptions + tickets + review
await page.goto(BASE + "/account/subscriptions");
await page.click('form button:has-text("Subscribe") >> nth=0');
await page.waitForFunction(() => document.body.innerText.includes("Lens Club") && document.body.innerText.includes("active"));
ok("subscribed", true);
await page.goto(BASE + "/account/tickets");
await page.fill('input[name="subject"]', "E2E fit question");
await page.fill('textarea[name="message"]', "Hello from e2e");
await Promise.all([page.waitForURL("**/account/tickets/*"), page.click('button:has-text("Open ticket")')]);
const ticketUrl = page.url();
ok("ticket opened", /\/account\/tickets\/\d+/.test(ticketUrl));
await page.fill('.composer input[name="text"]', "More info");
await page.click('.composer button:has-text("Send")');
await seen(page, "More info");
await page.goto(BASE + "/reviews");
await page.fill('input[name="title"]', "E2E review");
await page.fill('textarea[name="text"]', "Great lens, e2e approved.");
await page.click('button:has-text("Submit for moderation")');
await seen(page, "moderation");

// 7. admin flows
const actx = await browser.newContext();
const admin = await actx.newPage();
await admin.goto(BASE + "/admin");
await admin.waitForURL("**/login*");
await admin.fill('input[name="email"]', "admin@lensflow.shop");
await admin.fill('input[name="password"]', ADMIN_PW);
await Promise.all([admin.waitForURL("**/admin"), admin.click('button:has-text("Sign in")')]);
await seen(admin, "Revenue (paid)");
await admin.goto(BASE + "/admin/orders");
await seen(admin, code);
await admin.goto(ticketUrl.replace("/account/tickets/", "/admin/tickets/"));
await admin.fill('.composer input[name="text"]', "Admin reply here");
await admin.click('.composer button:has-text("Reply")');
await seen(admin, "Admin reply here");
await page.goto(ticketUrl);
await seen(page, "Admin reply here");
await admin.goto(BASE + "/admin/reviews");
await admin.click('button:has-text("Approve")');
await seen(admin, "live");
await page.goto(BASE + "/reviews");
await seen(page, "E2E review");
await admin.goto(BASE + "/admin/products");
await admin.fill('input[name="name"]', "E2E Test Lens");
await admin.fill('input[name="slug"]', "e2e-test-lens");
await admin.fill('input[name="price"]', "9.99");
await admin.fill('input[name="stock"]', "5");
await admin.click('button:has-text("Save product")');
await seen(admin, "E2E Test Lens");
await page.goto(BASE + "/products");
await seen(page, "E2E Test Lens");

// 8. reseller apply -> approve -> buy from balance
await page.goto(BASE + "/account/reseller");
await page.click('button:has-text("Apply now")');
await seen(page, "under review");
await admin.goto(BASE + "/admin/resellers");
await admin.click('button:has-text("Approve")');
await seen(admin, "Revoke");
await page.goto(BASE + "/account/reseller");
await seen(page, "your price");

// 9. dark mode persists
await page.goto(BASE + "/");
await page.click(".rail .rrow .iconbtn");
await page.reload();
ok("dark mode persisted", await page.evaluate(() => document.documentElement.dataset.scheme === "dark"));

// 10. maintenance gates public, spares admin
await admin.goto(BASE + "/admin/settings");
await admin.check('input[name="maintenance"]');
await admin.click('button:has-text("Save settings")');
await admin.waitForLoadState("networkidle");
const anon = await browser.newContext();
const anonPage = await anon.newPage();
await anonPage.goto(BASE + "/");
await seen(anonPage, "We'll be right back");
await admin.goto(BASE + "/");
await seen(admin, "Unleash");
await admin.goto(BASE + "/admin/settings");
await admin.uncheck('input[name="maintenance"]');
await admin.click('button:has-text("Save settings")');
await admin.waitForLoadState("networkidle");
await anonPage.goto(BASE + "/");
await seen(anonPage, "Unleash");

await browser.close();
console.log(`\nALL ${n} E2E CHECKS PASSED`);
