import { db , type Row} from "@/lib/db";
import { resellerDecision } from "@/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminResellers() {
  const rows = (await db()`SELECT * FROM users WHERE reseller_status IN ('applied','approved')`) as Row[];
  return (
    <>
      <h1 style={{ fontSize: 26 }}>Resellers</h1>
      <div className="card" style={{ padding: "8px 22px", marginTop: 16 }}><div className="twrap"><table>
        <thead><tr><th>Email</th><th>Status</th><th>Since</th><th></th></tr></thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id as number}>
              <td>{String(u.email)}</td>
              <td><span className={"status-pill " + (u.reseller_status === "approved" ? "st-ok" : "st-warn")}>{String(u.reseller_status)}</span></td>
              <td>{String(u.created).slice(0, 10)}</td>
              <td>
                {u.reseller_status === "applied" && (
                  <form action={resellerDecision.bind(null, u.id as number, true)} style={{ display: "inline" }}>
                    <button className="btn ghost" style={{ padding: "8px 14px" }}>Approve (−15%)</button>
                  </form>
                )}
                {u.reseller_status === "approved" && (
                  <form action={resellerDecision.bind(null, u.id as number, false)} style={{ display: "inline" }}>
                    <button className="btn ghost" style={{ padding: "8px 14px" }}>Revoke</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--sa-ink-soft)" }}>No applications.</td></tr>}
        </tbody>
      </table></div></div>
    </>
  );
}
