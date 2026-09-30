import { db , type Row} from "@/lib/db";
import { safe } from "@/lib/server";
import DbError from "@/components/DbError";

export const dynamic = "force-dynamic";

export default async function Blog() {
  const { data, down } = await safe(async () => db()`SELECT * FROM posts ORDER BY id DESC`);
  if (down || !data) return <DbError />;
  const posts = data as unknown as Row[];
  return (
    <>
      <div className="crumbs"><a href="/">Home</a> / <b>Blog</b></div>
      <h1 style={{ fontSize: 30, letterSpacing: "-.02em", marginBottom: 18 }}>Field notes</h1>
      {posts.length === 0 && <div className="empty">No posts yet.</div>}
      {posts.slice(0, 1).map((p) => (
        <a className="card featpost" key={p.id as number} href={"/post/" + (p.slug as string)}>
          <div className="thumb">◉</div>
          <div className="body"><time>{String(p.created).slice(0, 10)}</time>
            <h2 style={{ margin: "6px 0" }}>{p.title as string}</h2>
            <p style={{ color: "var(--sa-ink-soft)", fontSize: 14 }}>{p.excerpt as string}</p></div>
        </a>
      ))}
      <div className="bgrid">
        {posts.slice(1).map((p) => (
          <a className="card postcard" key={p.id as number} href={"/post/" + (p.slug as string)}>
            <div className="thumb">◎</div>
            <div className="body"><time>{String(p.created).slice(0, 10)}</time>
              <h3 style={{ margin: "6px 0" }}>{p.title as string}</h3>
              <p style={{ color: "var(--sa-ink-soft)", fontSize: 13 }}>{p.excerpt as string}</p></div>
          </a>
        ))}
      </div>
    </>
  );
}
