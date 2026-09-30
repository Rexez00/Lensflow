import { db , type Row} from "@/lib/db";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const sql = db();
  const revenue = (((await sql`SELECT COALESCE(SUM(total_cents),0) AS s FROM orders WHERE status IN ('paid','completed')`)[0] as Row).s as number) ?? 0;
  const orders = (((await sql`SELECT COUNT(*)::int AS c FROM orders`)[0] as Row).c as number) ?? 0;
  const customers = (((await sql`SELECT COUNT(*)::int AS c FROM users WHERE role = 'customer'`)[0] as Row).c as number) ?? 0;
  const tickets = (((await sql`SELECT COUNT(*)::int AS c FROM tickets WHERE status <> 'closed'`)[0] as Row).c as number) ?? 0;
  const low = (await sql`SELECT * FROM products WHERE stock < 10 ORDER BY stock`) as Row[];
  const recent = (await sql`SELECT * FROM orders ORDER BY id DESC LIMIT 8`) as Row[];
  return (
    <>
      <h1 style={{ fontSize: 26 }}>Admin dashboard</h1>
      <p style={{ color: "var(--sa-ink-soft)", fontSize: 14, margin: "6px 0 20px" }}>Store at a glance.</p>
      <div className="statgrid">
        <div className="card stat"><b>{money(revenue)}</b><span>Revenue (paid)</span></div>
        <div className="card stat"><b>{orders}</b><span>Orders</span></div>
        <div className="card stat"><b>{customers}</b><span>Customers</span></div>
        <div className="card stat"><b>{tickets}</b><span>Open tickets</span></div>
      </div>
      <div className="bgrid2">
        <div className="card" style={{ padding: 20 }}><h3>Recent orders</h3>
          {recent.map((o) => (
            <div key={o.id as number} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "8px 0", borderTop: "1px solid var(--sa-line)" }}>
              <span><b>{String(o.code)}</b> · {money(o.total_cents as number)}</span><span>{String(o.status)}</span>
            </div>
          ))}
          {recent.length === 0 && <p style={{ color: "var(--sa-ink-soft)" }}>None yet.</p>}
          <a href="/admin/orders" style={{ fontSize: 13, color: "var(--sa-accent)" }}>All orders →</a></div>
        <div className="card" style={{ padding: 20 }}><h3>Low stock (&lt; 10)</h3>
          {low.map((p) => (
            <div key={p.id as number} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "8px 0", borderTop: "1px solid var(--sa-line)" }}>
              <span>{String(p.name)}</span><b>{Number(p.stock)}</b>
            </div>
          ))}
          {low.length === 0 && <p style={{ color: "var(--sa-ink-soft)" }}>All stocked.</p>}
          <a href="/admin/products" style={{ fontSize: 13, color: "var(--sa-accent)" }}>Manage products →</a></div>
      </div>
    </>
  );
}
