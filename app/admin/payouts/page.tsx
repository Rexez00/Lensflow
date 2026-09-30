import { db , type Row} from "@/lib/db";
import { money } from "@/lib/format";
import { payoutDecision } from "@/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminPayouts() {
  const rows = (await db()`SELECT p.*, u.email FROM affiliate_payouts p JOIN users u ON u.id = p.user_id ORDER BY p.id DESC`) as Row[];
  return (
    <>
      <h1 style={{ fontSize: 26 }}>Affiliate payouts</h1>
      <div className="card" style={{ padding: "8px 22px", marginTop: 16 }}><div className="twrap"><table>
        <thead><tr><th>Affiliate</th><th>Amount</th><th>Details</th><th>Status</th><th>Date</th><th></th></tr></thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id as number}>
              <td>{String(p.email)}</td><td><b>{money(p.amount_cents as number)}</b></td><td>{String(p.details || "—")}</td>
              <td><span className={"status-pill " + (p.status === "approved" ? "st-ok" : p.status === "rejected" ? "st-err" : "st-warn")}>{String(p.status)}</span></td>
              <td>{String(p.created).slice(0, 16)}</td>
              <td>{p.status === "pending" ? (
                <span style={{ display: "flex", gap: 6 }}>
                  <form action={payoutDecision.bind(null, p.id as number, true)}><button className="btn ghost" style={{ padding: "8px 14px" }}>Approve</button></form>
                  <form action={payoutDecision.bind(null, p.id as number, false)}><button className="btn ghost" style={{ padding: "8px 14px" }}>Reject</button></form>
                </span>) : null}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--sa-ink-soft)" }}>No payout requests.</td></tr>}
        </tbody>
      </table></div></div>
    </>
  );
}
