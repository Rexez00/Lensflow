import { db, type Row } from "@/lib/db";
import { money } from "@/lib/format";
import { setOrderStatus } from "@/actions/admin";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "paid", "completed", "refunded", "cancelled"];
const PILL: Record<string, string> = { paid: "st-ok", completed: "st-ok", pending: "st-warn", refunded: "st-mut", cancelled: "st-err" };

async function saveStatus(id: number, form: FormData) {
  "use server";
  await setOrderStatus(id, String(form.get("status")));
}

export default async function AdminOrders() {
  const rows = (await db()`SELECT * FROM orders ORDER BY id DESC LIMIT 200`) as Row[];
  return (
    <>
      <h1 style={{ fontSize: 26 }}>Orders</h1>
      <p style={{ color: "var(--sa-ink-soft)", fontSize: 14, margin: "6px 0 20px" }}>{rows.length} most recent. COD orders stay pending until delivery — mark paid/completed on collection.</p>
      <div className="card" style={{ padding: "8px 22px" }}><div className="twrap"><table>
        <thead><tr><th>Code</th><th>Customer</th><th>Total</th><th>Ship / Pay</th><th>Status</th><th>Date</th><th></th></tr></thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id as number}>
              <td><b>{String(o.code)}</b><br /><small style={{ color: "var(--sa-ink-soft)" }}>{String(o.kind)}</small></td>
              <td style={{ fontSize: 13 }}>{String(o.shipping_name || o.email || "—")}<br />
                <small style={{ color: "var(--sa-ink-soft)" }}>{String(o.shipping_city || "")}{o.shipping_country ? `, ${String(o.shipping_country)}` : ""}</small></td>
              <td>{money(o.total_cents as number)}<br />
                <small style={{ color: "var(--sa-ink-soft)" }}>{o.coupon ? String(o.coupon) : ""}</small></td>
              <td style={{ fontSize: 13 }}><small>{String(o.shipping_method || "—")} · {String(o.payment_method || "—")}</small></td>
              <td><span className={"status-pill " + (PILL[String(o.status)] ?? "st-mut")}>{String(o.status)}</span></td>
              <td>{String(o.created).slice(0, 16)}</td>
              <td>
                <form action={saveStatus.bind(null, o.id as number)} style={{ display: "flex", gap: 6 }}>
                  <select className="input" name="status" defaultValue={String(o.status)} style={{ width: "auto", padding: 8 }}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <button className="btn ghost" style={{ padding: "8px 14px" }}>Save</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div></div>
    </>
  );
}
