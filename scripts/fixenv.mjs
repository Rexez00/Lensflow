import { readFileSync, appendFileSync } from "fs";
import { randomBytes } from "crypto";
const p = new URL("../.env.local", import.meta.url);
let cur = "";
try { cur = readFileSync(p, "utf8"); } catch {}
const need = [];
if (!/^AUTH_SECRET=/m.test(cur)) need.push("AUTH_SECRET=" + randomBytes(32).toString("base64"));
if (!/^AUTH_TRUST_HOST=/m.test(cur)) need.push("AUTH_TRUST_HOST=true");
if (!/^NEXT_PUBLIC_SITE_URL=/m.test(cur)) need.push("NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3101");
if (need.length) {
  appendFileSync(p, (cur.endsWith("\n") || cur === "" ? "" : "\n") + need.join("\n") + "\n");
  console.log("appended " + need.length + " line(s) to .env.local (values not shown)");
} else console.log("env already complete");
