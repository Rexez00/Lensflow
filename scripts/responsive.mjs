/** Responsive overflow probe: 390px viewport, key pages must not scroll horizontally. */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3101";
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 390, height: 844 } });
const p = await c.newPage();
let fail = 0;
for (const path of ["/", "/products", "/cart", "/login", "/faq", "/contact", "/admin"]) {
  await p.goto(BASE + path, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(1500);
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log((overflow <= 1 ? "ok: " : "FAIL: ") + `no h-overflow ${path} @390px (delta=${overflow})`);
  if (overflow > 1) fail++;
}
await b.close();
if (fail) process.exit(1);
console.log("RESPONSIVE PASSED");
