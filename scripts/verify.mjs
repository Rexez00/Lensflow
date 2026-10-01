const pages = ["/", "/products", "/cart", "/login"];
for (const p of pages) {
  const r = await fetch("http://127.0.0.1:3101" + p);
  const t = await r.text();
  console.log(p, r.status, "brand=" + /Simple Lens/.test(t), "mad=" + /MAD/.test(t), "broken=" + /Cannot find module|Internal Server Error/.test(t));
}
const home = await (await fetch("http://127.0.0.1:3101/")).text();
console.log("empty-home=" + /New lenses are on their way/.test(home));
const shop = await (await fetch("http://127.0.0.1:3101/products")).text();
console.log("empty-shop=" + /being stocked/.test(shop));
const m = home.match(/\/_next\/static\/css\/app\/layout\.css[^"']*/);
if (m) {
  const css = await fetch("http://127.0.0.1:3101" + m[0]);
  console.log("css-status:", css.status);
}
const admin = await fetch("http://127.0.0.1:3101/admin", { redirect: "manual" });
console.log("admin:", admin.status, "->", admin.headers.get("location"));
