import { db , type Row} from "@/lib/db";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminCustomers() {
  const rows = (await db()`SELECT u.*, (SELECT COALESCE(SUM(total_cents),0) FROM orders WHERE user_id = u.id AND status IN ('paid','completed')) AS spent,
    (SELECT COUNT(*)::int FROM orders WHERE user_id = u.id) AS orders
    FROM users u ORDER BY u.id DESC`) as Row[];
  return (
    <>
      <h1 style={{ fontSize: 26 }}>Customers</h1>
      <p style={{ color: "var(--sa-ink-soft)", fontSize: 14, margin: "6px 0 20px" }}>{rows.length} accounts.</p>
      <div className="card" style={{ padding: "8px 22px" }}><div className="twrap"><table>
        <thead><tr><th>Email</th><th>Role</th><th>Spent</th><th>Orders</th><th>Balance</th><th>Reseller</th><th>Joined</th></tr></thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id as number}>
              <td><b>{String(u.email)}</b><br /><small style={{ color: "var(--sa-ink-soft)" }}>{String(u.name || "")}</small></td>
              <td><span className={"status-pill " + (u.role === "admin" ? "st-info" : "st-mut")}>{String(u.role)}</span></td>
              <td>{money(u.spent as number)}</td>
              <td>{Number(u.orders)}</td>
              <td>{money(u.balance_cents as number)}</td>
              <td>{String(u.reseller_status)}</td>
              <td>{String(u.created).slice(0, 10)}</td>
            </tr>
          ))}
        </tbody>
      </table></div></div>
    </>
  );
}
