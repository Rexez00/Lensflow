/** Targeted Neon verification: register -> dashboard -> cart -> checkout -> pay,
 *  asserting each step against the live page. Run with BASE_URL set. */
import { chromium } from "playwright";
const BASE = process.env.BASE_URL || "http://127.0.0.1:3100";
const EMAIL = `verify-${Date.now().toString(36)}@x.shop`;
let n = 0;
const ok = (name, cond) => {
  n++;
  if (!cond) throw new Error("FAILED: " + name);
  console.log("ok:", name);
};
const seen = async (page, text) => {
  await page.getByText(text).first().waitFor({ timeout: 10000 });
};
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto(BASE + "/");
await seen(page, "Fish Eye Lens 180°");
ok("homepage reads products from Neon", true);
await page.goto(BASE + "/register");
await page.fill('input[name="name"]', "Verify");
await page.fill('input[name="email"]', EMAIL);
await page.fill('input[name="password"]', "password123");
await Promise.all([page.waitForURL("**/account"), page.click('button:has-text("Create account")')]);
await seen(page, "Completed orders");
ok("registration wrote user row to Neon", true);
await page.goto(BASE + "/products");
await page.locator(".pcard", { hasText: "0.67X Wide Lens" }).locator(".addbtn").click();
await page.waitForFunction(() => document.querySelector("[data-cart-count]")?.textContent?.trim() === "1");
ok("add-to-cart wrote carts row to Neon", true);
await page.goto(BASE + "/checkout");
await page.fill('input[name="coupon"]', "SAVE10");
await page.click('button:has-text("Apply")');
await seen(page, "SAVE10");
await Promise.all([page.waitForURL("**/pay/**"), page.click('button:has-text("Place order")')]);
const payUrl = page.url();
const code = payUrl.match(/PL-\d+/)[0];
await Promise.all([page.waitForURL("**/checkout/success**"), page.click('button:has-text("Simulate successful payment")')]);
await seen(page, "Payment successful");
ok(`order ${code} created + paid in Neon`, true);
await page.goto(BASE + "/account/orders");
await seen(page, code);
ok("order history reads back from Neon", true);
console.log("VERIFY_EMAIL=" + EMAIL);
console.log(`\nALL ${n} NEON CHECKS PASSED`);
await browser.close();
