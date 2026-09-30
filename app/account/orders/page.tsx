import { auth } from "@/auth";
import { db , type Row} from "@/lib/db";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

const PILL: Record<string, string> = { paid: "st-ok", completed: "st-ok", pending: "st-warn", refunded: "st-mut", cancelled: "st-err" };

export default async function Orders() {
  const session = await auth();
  const uid = Number((session?.user as { id?: string })?.id);
  const rows = (await db()`SELECT * FROM orders WHERE user_id = ${uid} ORDER BY id DESC`) as Row[];
  const out: { o: Row; label: string }[] = [];
  for (const o of rows) {
    const n = ((await db()`SELECT COUNT(*)::int AS c FROM order_items WHERE order_id = ${o.id}`)[0] as Row).c as number;
    const first = (await db()`SELECT name FROM order_items WHERE order_id = ${o.id} LIMIT 1`)[0] as Row | undefined;
    out.push({ o, label: (first ? String(first.name) : String(o.code)) + (n > 1 ? ` +${n - 1} more` : "") });
  }
  return (
    <>
      <h1 style={{ fontSize: 26 }}>Orders</h1>
      <p style={{ color: "var(--sa-ink-soft)", fontSize: 14, margin: "6px 0 20px" }}>Invoices, receipts and support actions.</p>
      <div className="card" style={{ padding: "8px 22px" }}><div className="twrap"><table>
        <thead><tr><th>Order</th><th>Date</th><th>Total</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {out.map(({ o, label }) => (
            <tr key={o.id as number}>
              <td><b>{label}</b><br /><small style={{ color: "var(--sa-accent)" }}>{String(o.code)}</small></td>
              <td>{String(o.created).slice(0, 10)}</td>
              <td>{money(o.total_cents as number)}</td>
              <td><span className={"status-pill " + (PILL[String(o.status)] ?? "st-mut")}>{String(o.status)}</span></td>
              <td><a className="btn ghost" style={{ padding: "8px 16px" }} href="/account/tickets">Ticket</a></td>
            </tr>
          ))}
          {out.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--sa-ink-soft)" }}>No orders yet.</td></tr>}
        </tbody>
      </table></div></div>
    </>
  );
}
