import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db , type Row} from "@/lib/db";
import { replyTicketAction, closeTicketAction } from "@/actions/shop";

export const dynamic = "force-dynamic";

export default async function Ticket({ params }: { params: { tid: string } }) {
  const session = await auth();
  const uid = Number((session?.user as { id?: string })?.id);
  const me = session?.user as { name?: string | null; email?: string } | undefined;
  const sql = db();
  const rows = await sql`SELECT * FROM tickets WHERE id = ${Number(params.tid)} AND user_id = ${uid}`;
  const t = rows[0] as Row | undefined;
  if (!t) notFound();
  const msgs = (await sql`SELECT m.*, u.name AS uname FROM messages m LEFT JOIN users u ON u.id = m.user_id
    WHERE ticket_id = ${Number(params.tid)} ORDER BY id`) as Row[];
  const closed = t.status === "closed";
  return (
    <>
      <a href="/account/tickets" style={{ fontSize: 14, color: "var(--sa-ink-soft)", textDecoration: "none" }}>← All tickets</a>
      <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "8px 0 16px", flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 24 }}>{String(t.subject)}</h1>
        <span className={"status-pill " + (closed ? "st-ok" : "st-info")}>{String(t.status)}</span>
      </div>
      <div className="card" style={{ padding: 20 }}>
        <div className="thread">
          {msgs.map((m) => {
            const own = Number(m.user_id) === uid && !m.is_admin;
            return (
              <div className={"msg" + (own ? " own" : "")} key={m.id as number}>
                <span className="ava">{m.is_admin ? "S" : "J"}</span>
                <div className="bubble"><small style={{ color: "var(--sa-ink-soft)" }}>
                  {m.is_admin ? "Support" : String(m.uname || me?.name || "You")}</small><br />{String(m.text)}</div>
              </div>
            );
          })}
        </div>
        {!closed ? (
          <>
            <form action={replyTicketAction.bind(null, Number(params.tid))} className="composer">
              <input className="input" name="text" placeholder="Write a reply…" required />
              <button className="btn">Send</button>
            </form>
            <form action={closeTicketAction.bind(null, Number(params.tid))} style={{ marginTop: 10 }}>
              <button className="btn ghost">Close ticket</button>
            </form>
          </>
        ) : <p style={{ color: "var(--sa-ink-soft)", fontSize: 14 }}>This ticket is closed.</p>}
      </div>
    </>
  );
}
