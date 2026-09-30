import { db , type Row} from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminTickets() {
  const rows = (await db()`SELECT t.*, u.email FROM tickets t JOIN users u ON u.id = t.user_id ORDER BY t.id DESC`) as Row[];
  return (
    <>
      <h1 style={{ fontSize: 26 }}>Support tickets</h1>
      <div className="card" style={{ padding: "8px 22px", marginTop: 16 }}>
        {rows.map((t, i) => (
          <div key={t.id as number} style={{ display: "flex", gap: 12, alignItems: "center", padding: "14px 0", borderTop: i ? "1px solid var(--sa-line)" : 0 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <a href={`/admin/tickets/${t.id}`} style={{ fontWeight: 600, textDecoration: "none" }}>{String(t.subject)}</a><br />
              <small style={{ color: "var(--sa-ink-soft)" }}>#{String(t.id)} · {String(t.email)} · {String(t.created).slice(0, 16)}</small>
            </div>
            <span className={"status-pill " + (t.status === "closed" ? "st-ok" : "st-info")}>{String(t.status)}</span>
            <a className="btn ghost" style={{ padding: "8px 14px" }} href={`/admin/tickets/${t.id}`}>Open</a>
          </div>
        ))}
        {rows.length === 0 && <p style={{ padding: 20, textAlign: "center", color: "var(--sa-ink-soft)" }}>No tickets.</p>}
      </div>
    </>
  );
}
