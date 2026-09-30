import { auth } from "@/auth";
import { db , type Row} from "@/lib/db";
import { money } from "@/lib/format";
import { updateProfileAction } from "@/actions/shop";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await auth();
  const uid = Number((session?.user as { id?: string })?.id);
  const sql = db();
  const u = (await sql`SELECT * FROM users WHERE id = ${uid}`)[0] as Row;
  const spent = ((await sql`SELECT COALESCE(SUM(total_cents),0) AS s FROM orders WHERE user_id = ${uid} AND status = 'paid'`)[0] as Row).s as number;
  const done = ((await sql`SELECT COUNT(*)::int AS c FROM orders WHERE user_id = ${uid} AND status IN ('paid','completed')`)[0] as Row).c as number;
  const latest = (await sql`SELECT * FROM orders WHERE user_id = ${uid} ORDER BY id DESC LIMIT 1`)[0] as Row | undefined;
  let lname = "";
  if (latest) {
    const items = (await sql`SELECT name FROM order_items WHERE order_id = ${latest.id} LIMIT 2`) as Row[];
    const n = ((await sql`SELECT COUNT(*)::int AS c FROM order_items WHERE order_id = ${latest.id}`)[0] as Row).c as number;
    lname = items.length ? String(items[0].name) + (n > 1 ? ` +${n - 1} more` : "") : String(latest.code);
  }
  return (
    <>
      <h1 style={{ fontSize: 26 }}>Welcome back, {String(u.name || "friend")}</h1>
      <p style={{ color: "var(--sa-ink-soft)", fontSize: 14, margin: "6px 0 20px" }}>Customer since {String(u.created).slice(0, 10)}.</p>
      <div className="statgrid">
        <div className="card stat"><b>{done}</b><span>Completed orders</span></div>
        <div className="card stat"><b>{money(spent)}</b><span>Total spent</span></div>
        <div className="card stat"><b>{money(u.balance_cents as number)}</b><span>Balance · <a href="/account/balance" style={{ color: "var(--sa-accent)" }}>Top up</a></span></div>
        <div className="card stat"><b>{(u.affiliate_code as string) || "—"}</b><span>Affiliate code</span></div>
      </div>
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center" }}><h3>Latest order</h3>
          <a href="/account/orders" style={{ marginLeft: "auto", fontSize: 13, color: "var(--sa-accent)" }}>View all →</a></div>
        {latest ? (
          <p style={{ fontSize: 14, marginTop: 10 }}><b>{lname}</b><br />
            <span style={{ color: "var(--sa-ink-soft)" }}>{String(latest.code)} · {String(latest.created).slice(0, 10)} · {String(latest.status)}</span></p>
        ) : <p style={{ color: "var(--sa-ink-soft)", fontSize: 14, marginTop: 10 }}>No orders yet — <a href="/products" style={{ color: "var(--sa-accent)" }}>browse lenses</a>.</p>}
      </div>
      <div className="card" style={{ padding: 22, marginTop: 14 }}>
        <h3>Profile</h3>
        <form action={updateProfileAction} style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <input className="input" name="name" defaultValue={String(u.name || "")} placeholder="Display name" style={{ maxWidth: 260 }} />
          <button className="btn ghost">Save</button>
        </form>
        <p style={{ fontSize: 13, color: "var(--sa-ink-soft)", marginTop: 8 }}>{String(u.email)}</p>
      </div>
    </>
  );
}
