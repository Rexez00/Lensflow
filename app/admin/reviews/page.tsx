import { db , type Row} from "@/lib/db";
import { approveReview, deleteReview } from "@/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminReviews() {
  const rows = (await db()`SELECT r.*, p.name AS pname FROM reviews r LEFT JOIN products p ON p.id = r.product_id ORDER BY r.id DESC`) as Row[];
  return (
    <>
      <h1 style={{ fontSize: 26 }}>Reviews</h1>
      <p style={{ color: "var(--sa-ink-soft)", fontSize: 14, margin: "6px 0 20px" }}>Approve new reviews before they go public.</p>
      {rows.map((r) => (
        <div className="card" style={{ padding: 18, marginBottom: 12 }} key={r.id as number}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <b>{String(r.title)}</b>
            <span className={"status-pill " + (r.approved ? "st-ok" : "st-warn")}>{r.approved ? "live" : "pending"}</span>
            <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--sa-ink-soft)" }}>
              {Number(r.stars)}★ · {String(r.name)} · {String(r.pname ?? "—")}
            </span>
          </div>
          <p style={{ fontSize: 14, color: "var(--sa-ink-soft)", margin: "8px 0" }}>{String(r.text)}</p>
          <div style={{ display: "flex", gap: 8 }}>
            {!r.approved && (
              <form action={approveReview.bind(null, r.id as number)}>
                <button className="btn ghost" style={{ padding: "8px 14px" }}>Approve</button>
              </form>
            )}
            <form action={deleteReview.bind(null, r.id as number)}>
              <button className="btn ghost" style={{ padding: "8px 14px" }}>Delete</button>
            </form>
          </div>
        </div>
      ))}
      {rows.length === 0 && <div className="empty">No reviews.</div>}
    </>
  );
}
