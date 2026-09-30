import { auth } from "@/auth";
import { db , type Row} from "@/lib/db";
import { money } from "@/lib/format";
import { topupAction } from "@/actions/shop";

export const dynamic = "force-dynamic";

export default async function Balance() {
  const session = await auth();
  const uid = Number((session?.user as { id?: string })?.id);
  const sql = db();
  const u = (await sql`SELECT balance_cents FROM users WHERE id = ${uid}`)[0] as Row;
  const txns = (await sql`SELECT * FROM transactions WHERE user_id = ${uid} ORDER BY id DESC LIMIT 30`) as Row[];
  return (
    <>
      <h1 style={{ fontSize: 26 }}>Balance</h1>
      <p style={{ color: "var(--sa-ink-soft)", fontSize: 14, margin: "6px 0 20px" }}>Top up once, check out in one tap.</p>
      <div className="bgrid2" style={{ marginBottom: 18 }}>
        <div className="card" style={{ padding: 22, borderColor: "var(--sa-accent)" }}>
          <span style={{ fontSize: 12, color: "var(--sa-ink-soft)" }}>AVAILABLE</span>
          <div style={{ fontSize: 34, fontWeight: 800 }}>{money(u.balance_cents as number)}</div>
          <small style={{ color: "var(--sa-ink-soft)" }}>Used automatically when you pay with balance</small>
        </div>
        <div className="card" style={{ padding: 22 }}><h3>Top up</h3>
          <form action={topupAction} style={{ marginTop: 12 }}>
            <div className="field"><label>Amount (USD)</label>
              <input className="input" name="amount" type="number" min="1" max="500" step="1" defaultValue="10" /></div>
            <button className="btn" style={{ width: "100%" }}>Continue to payment</button>
          </form></div>
      </div>
      <div className="card" style={{ padding: "8px 22px" }}><h3 style={{ padding: "14px 0 4px" }}>History</h3>
        <div className="twrap"><table>
          <thead><tr><th>Type</th><th>Description</th><th>Amount</th><th>Date</th></tr></thead>
          <tbody>
            {txns.map((t) => (
              <tr key={t.id as number}><td>{String(t.kind)}</td><td>{String(t.label)}</td>
                <td><b>{money(t.amount_cents as number)}</b></td>
                <td style={{ color: "var(--sa-ink-soft)" }}>{String(t.created).slice(0, 16)}</td></tr>
            ))}
            {txns.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--sa-ink-soft)" }}>No transactions.</td></tr>}
          </tbody>
        </table></div></div>
    </>
  );
}
