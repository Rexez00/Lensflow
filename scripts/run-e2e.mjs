// One-shot runner: starts prod server, waits, runs Playwright e2e, stops server.
// Usage: node scripts/run-e2e.mjs  (foreground; nothing outlives this process)
import { spawn } from "child_process";

const PORT = 3104;
const BASE = "http://127.0.0.1:" + PORT;

const server = spawn(
  process.execPath,
  ["--env-file=.env.local", "node_modules/next/dist/bin/next", "start", "--port", String(PORT)],
  { stdio: ["ignore", "pipe", "pipe"] }
);
server.stdout.on("data", (d) => process.stdout.write("[server] " + d));
server.stderr.on("data", (d) => process.stderr.write("[server] " + d));

let ready = false;
for (let i = 0; i < 60; i++) {
  try {
    const r = await fetch(BASE + "/");
    if (r.status === 200) { ready = true; break; }
  } catch {}
  await new Promise((r) => setTimeout(r, 2000));
}
if (!ready) {
  console.error("server never became ready");
  server.kill();
  process.exit(1);
}
console.log("server ready, running e2e…");
const code = await new Promise((resolve) => {
  const t = spawn(process.execPath, ["scripts/e2e.mjs"], {
    stdio: "inherit",
    env: { ...process.env, BASE_URL: BASE, ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "admin123" },
  });
  t.on("close", resolve);
});
console.log("e2e exited with code " + code);
server.kill();
await new Promise((r) => setTimeout(r, 2000));
try { process.kill(server.pid, "SIGKILL"); } catch {}
process.exit(code ?? 1);
