import { auth } from "@/auth";
import { db , type Row} from "@/lib/db";
import { money } from "@/lib/format";
import { PLANS } from "@/lib/shop";
import { subscribeAction, cancelSubAction } from "@/actions/shop";

export const dynamic = "force-dynamic";

export default async function Subs({ searchParams }: { searchParams: { ok?: string } }) {
  const session = await auth();
  const uid = Number((session?.user as { id?: string })?.id);
  const subs = (await db()`SELECT * FROM subscriptions WHERE user_id = ${uid} ORDER BY id DESC`) as Row[];
  return (
    <>
      <h1 style={{ fontSize: 26 }}>Subscriptions</h1>
      <p style={{ color: "var(--sa-ink-soft)", fontSize: 14, margin: "6px 0 20px" }}>Recurring plans on your account.</p>
      {searchParams.ok ? <div className="card" style={{ padding: 12, marginBottom: 14 }}>Saved.</div> : null}
      <div className="card" style={{ padding: "8px 22px", marginBottom: 16 }}><div className="twrap"><table>
        <thead><tr><th>Plan</th><th>Billing</th><th>Renews</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {subs.map((s) => (
            <tr key={s.id as number}>
              <td><b>{String(s.plan)}</b></td>
              <td>{money(s.price_cents as number)} / {String(s.interval)}</td>
              <td>{String(s.renews || "—")}</td>
              <td><span className={"status-pill " + (s.status === "active" ? "st-ok" : "st-mut")}>{String(s.status)}</span></td>
              <td>{s.status === "active" ? (
                <form action={cancelSubAction.bind(null, s.id as number)}>
                  <button className="btn ghost" style={{ padding: "8px 16px" }}>Cancel</button>
                </form>) : null}</td>
            </tr>
          ))}
          {subs.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--sa-ink-soft)" }}>No subscriptions.</td></tr>}
        </tbody>
      </table></div></div>
      <div className="card" style={{ padding: 22 }}><h3>Available plans</h3>
        {PLANS.map((p) => (
          <form key={p.slug} action={subscribeAction.bind(null, p.slug)} style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
            <b>{p.name}</b><span style={{ color: "var(--sa-ink-soft)", fontSize: 14 }}>{money(p.price)} / {p.interval}</span>
            <button className="btn ghost" style={{ marginLeft: "auto" }}>Subscribe</button>
          </form>
        ))}
      </div>
    </>
  );
}
