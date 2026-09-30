import { auth } from "@/auth";
import { db , type Row} from "@/lib/db";
import { safe } from "@/lib/server";
import DbError from "@/components/DbError";
import { reviewAction } from "@/actions/shop";

export const dynamic = "force-dynamic";

export default async function Reviews({ searchParams }: { searchParams: { sort?: string; ok?: string } }) {
  const sort = searchParams.sort ?? "new";
  const order = sort === "hi" ? "stars DESC" : sort === "lo" ? "stars ASC" : sort === "old" ? "r.id ASC" : "r.id DESC";
  const { data, down } = await safe(async () => {
    const sql = db();
    const revs = await sql.unsafe(
      `SELECT r.*, p.name AS pname FROM reviews r LEFT JOIN products p ON p.id = r.product_id WHERE approved = TRUE ORDER BY ${order}`
    );
    const prods = await sql`SELECT id, name FROM products WHERE active = TRUE`;
    return { revs, prods };
  });
  if (down || !data) return <DbError />;
  const session = await auth();
  const tab = (s: string, label: string) => (
    <a key={s} href={"/reviews?sort=" + s} className={sort === s ? "on" : ""}>{label}</a>
  );
  return (
    <>
      <div className="crumbs"><a href="/">Home</a> / <b>Reviews</b></div>
      <h1 style={{ fontSize: 30, letterSpacing: "-.02em" }}>Loved by creators</h1>
      {searchParams.ok === "moderation" ? <div className="card" style={{ padding: 12, margin: "12px 0" }}>Review submitted for moderation.</div> : null}
      <div className="sortrow" style={{ margin: "16px 0" }}>
        {tab("new", "Newest")}{tab("old", "Oldest")}{tab("hi", "Highest rated")}{tab("lo", "Lowest rated")}
      </div>
      {(data.revs as Row[]).map((r) => (
        <article className="card rev" key={r.id as number}>
          <header><span className="stars">★★★★★</span><span className="verified">Verified</span>
            <time style={{ marginLeft: "auto" }}>{String(r.created).slice(0, 10)}</time></header>
          <h3>{r.title as string}</h3>
          <p style={{ margin: "6px 0" }}>{r.text as string}</p>
          <small style={{ color: "var(--sa-ink-soft)" }}>— {r.name as string}{r.pname ? ` · ${r.pname}` : ""}</small>
        </article>
      ))}
      {session?.user ? (
        <div className="card" style={{ padding: 22, marginTop: 18 }}><h3>Leave a review</h3>
          <form action={reviewAction} style={{ marginTop: 12 }}>
            <div className="field"><label>Product</label>
              <select className="input" name="product_id">
                {(data.prods as Row[]).map((p) => <option key={p.id as number} value={p.id as number}>{p.name as string}</option>)}
              </select></div>
            <div className="field"><label>Rating (1–5)</label><input className="input" name="stars" type="number" min="1" max="5" defaultValue="5" /></div>
            <div className="field"><label>Title</label><input className="input" name="title" /></div>
            <div className="field"><label>Review</label><textarea className="input" name="text" rows={3} /></div>
            <button className="btn">Submit for moderation</button>
          </form></div>
      ) : <p style={{ marginTop: 16 }}><a className="btn ghost" href="/login?next=/reviews">Sign in to review</a></p>}
    </>
  );
}
