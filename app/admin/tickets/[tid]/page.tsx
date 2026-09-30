import { notFound } from "next/navigation";
import { db , type Row} from "@/lib/db";
import { adminReplyTicket, setTicketStatus } from "@/actions/admin";

export const dynamic = "force-dynamic";

async function reply(tid: number, form: FormData) {
  "use server";
  await adminReplyTicket(tid, form);
}
async function setStatus(tid: number, form: FormData) {
  "use server";
  await setTicketStatus(tid, String(form.get("status")));
}

export default async function AdminTicket({ params }: { params: { tid: string } }) {
  const tid = Number(params.tid);
  const sql = db();
  const rows = await sql`SELECT t.*, u.email FROM tickets t JOIN users u ON u.id = t.user_id WHERE t.id = ${tid}`;
  const t = rows[0] as Row | undefined;
  if (!t) notFound();
  const msgs = (await sql`SELECT * FROM messages WHERE ticket_id = ${tid} ORDER BY id`) as Row[];
  return (
    <>
      <a href="/admin/tickets" style={{ fontSize: 14, color: "var(--sa-ink-soft)", textDecoration: "none" }}>← All tickets</a>
      <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "8px 0 16px" }}>
        <h1 style={{ fontSize: 22 }}>{String(t.subject)}</h1>
        <span className={"status-pill " + (t.status === "closed" ? "st-ok" : "st-info")}>{String(t.status)}</span>
      </div>
      <p style={{ fontSize: 13, color: "var(--sa-ink-soft)", marginBottom: 14 }}>
        #{String(t.id)} · {String(t.email)} · opened {String(t.created).slice(0, 16)}
      </p>
      <div className="card" style={{ padding: 20 }}>
        <div className="thread">
          {msgs.map((m) => (
            <div className={"msg" + (m.is_admin ? " own" : "")} key={m.id as number}>
              <span className="ava">{m.is_admin ? "S" : "C"}</span>
              <div className="bubble">{String(m.text)}<br /><small style={{ color: "var(--sa-ink-soft)" }}>{String(m.created).slice(0, 16)}</small></div>
            </div>
          ))}
        </div>
        <form action={reply.bind(null, tid)} className="composer">
          <input className="input" name="text" placeholder="Reply as support…" required />
          <button className="btn">Reply</button>
        </form>
        <form action={setStatus.bind(null, tid)} style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button className="btn ghost" name="status" value="closed">Close</button>
          <button className="btn ghost" name="status" value="open">Reopen</button>
        </form>
      </div>
    </>
  );
}
