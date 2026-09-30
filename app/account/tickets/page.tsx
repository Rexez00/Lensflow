import { auth } from "@/auth";
import { db , type Row} from "@/lib/db";
import { openTicketAction } from "@/actions/shop";

export const dynamic = "force-dynamic";

export default async function Tickets() {
  const session = await auth();
  const uid = Number((session?.user as { id?: string })?.id);
  const sql = db();
  const rows = (await sql`SELECT t.*, (SELECT text FROM messages WHERE ticket_id = t.id ORDER BY id DESC LIMIT 1) AS preview
    FROM tickets t WHERE user_id = ${uid} ORDER BY id DESC`) as Row[];
  const orders = (await sql`SELECT id, code FROM orders WHERE user_id = ${uid} ORDER BY id DESC`) as Row[];
  const pill = (s: string) => s === "closed" ? "st-ok" : s === "awaiting" ? "st-warn" : "st-info";
  return (
    <>
      <h1 style={{ fontSize: 26 }}>Support tickets</h1>
      <p style={{ color: "var(--sa-ink-soft)", fontSize: 14, margin: "6px 0 20px" }}>
        Open a new ticket from an <a href="/account/orders" style={{ color: "var(--sa-accent)" }}>order</a> — it arrives with context attached.
      </p>
      <div className="card" style={{ padding: 22, marginBottom: 16 }}><h3>New ticket</h3>
        <form action={openTicketAction} style={{ marginTop: 12 }}>
          <div className="field"><label>Subject</label><input className="input" name="subject" required maxLength={200} /></div>
          <div className="field"><label>Related order</label>
            <select className="input" name="order_id"><option value="">— none —</option>
              {orders.map((o) => <option key={o.id as number} value={o.id as number}>{String(o.code)}</option>)}
            </select></div>
          <div className="field"><label>Message</label><textarea className="input" name="message" rows={3} required /></div>
          <button className="btn">Open ticket</button>
        </form></div>
      <div className="card" style={{ padding: "8px 22px" }}>
        {rows.map((t) => (
          <div key={t.id as number} style={{ display: "flex", gap: 12, alignItems: "center", padding: "16px 0", borderTop: "1px solid var(--sa-line)" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <a href={`/account/tickets/${t.id}`} style={{ fontWeight: 600, textDecoration: "none" }}>{String(t.subject)}</a><br />
              <small style={{ color: "var(--sa-ink-soft)" }}>#{String(t.id)} · {String(t.preview ?? "").slice(0, 90)}</small>
            </div>
            <span className={"status-pill " + pill(String(t.status))}>{String(t.status)}</span>
            <a className="btn ghost" style={{ padding: "8px 16px" }} href={`/account/tickets/${t.id}`}>View</a>
          </div>
        ))}
        {rows.length === 0 && <p style={{ padding: 20, textAlign: "center", color: "var(--sa-ink-soft)" }}>No tickets yet.</p>}
      </div>
    </>
  );
}
