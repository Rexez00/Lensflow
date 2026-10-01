import { auth } from "@/auth";
import { db , type Row} from "@/lib/db";
import { money } from "@/lib/format";
import { siteUrl } from "@/lib/shop";
import { payoutAction } from "@/actions/shop";

export const dynamic = "force-dynamic";

export default async function Affiliate({ searchParams }: { searchParams: { ok?: string; error?: string } }) {
  const session = await auth();
  const uid = Number((session?.user as { id?: string })?.id);
  const sql = db();
  const u = (await sql`SELECT * FROM users WHERE id = ${uid}`)[0] as Row;
  const link = `${siteUrl()}/register?a=${u.affiliate_code ?? ""}`;
  const earned = (((await sql`SELECT COALESCE(SUM(amount_cents),0) AS s FROM transactions WHERE user_id = ${uid} AND kind = 'commission'`)[0] as Row).s as number) ?? 0;
  const refs = (await sql`SELECT email, created FROM users WHERE referred_by = ${uid} ORDER BY id DESC`) as Row[];
  const payouts = (await sql`SELECT * FROM affiliate_payouts WHERE user_id = ${uid} ORDER BY id DESC`) as Row[];
  return (
    <>
      <h1 style={{ fontSize: 26 }}>Affiliate program</h1>
      <p style={{ color: "var(--sa-ink-soft)", fontSize: 14, margin: "6px 0 20px" }}>Earn 10% on every order from your referrals.</p>
      {searchParams.ok === "payout" ? <div className="card" style={{ padding: 12, marginBottom: 14 }}>Payout requested.</div> : null}
      {searchParams.error === "amount" ? <div className="card" style={{ padding: 12, marginBottom: 14 }}>Amount must be between $1 and your balance.</div> : null}
      <div className="bgrid2" style={{ marginBottom: 14 }}>
        <div className="card" style={{ padding: 20 }}><h3>Your link</h3>
          <p style={{ fontSize: 13, margin: "8px 0", wordBreak: "break-all" }}><code>{link}</code></p></div>
        <div className="card" style={{ padding: 20 }}><h3>Lifetime earned</h3>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{money(earned)}</div>
          <small style={{ color: "var(--sa-ink-soft)" }}>Balance: {money(u.balance_cents as number)}</small></div>
      </div>
      <div className="card" style={{ padding: 20, marginBottom: 14 }}><h3>Request payout</h3>
        <form action={payoutAction} style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <input className="input" name="amount" type="number" min="1" step="0.01" placeholder="Amount MAD" style={{ maxWidth: 180 }} />
          <input className="input" name="details" placeholder="Payout details (e.g. wallet)" style={{ flex: 1, minWidth: 200 }} />
          <button className="btn">Request</button>
        </form></div>
      <div className="card" style={{ padding: "8px 22px" }}><h3 style={{ padding: "14px 0 4px" }}>Referred customers</h3>
        <div className="twrap"><table>
          <thead><tr><th>Email</th><th>Joined</th></tr></thead>
          <tbody>
            {refs.map((r, i) => <tr key={i}><td>{String(r.email)}</td><td>{String(r.created).slice(0, 10)}</td></tr>)}
            {refs.length === 0 && <tr><td colSpan={2} style={{ textAlign: "center", color: "var(--sa-ink-soft)" }}>No referrals yet — share your link.</td></tr>}
          </tbody>
        </table></div></div>
    </>
  );
}
