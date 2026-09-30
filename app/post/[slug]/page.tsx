import { notFound } from "next/navigation";
import { db , type Row} from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Post({ params }: { params: { slug: string } }) {
  const rows = await db()`SELECT * FROM posts WHERE slug = ${params.slug}`;
  const p = rows[0] as Row | undefined;
  if (!p) notFound();
  const more = (await db()`SELECT * FROM posts WHERE id <> ${p.id} ORDER BY id DESC LIMIT 3`) as Row[];
  return (
    <div className="article">
      <a href="/blog" style={{ fontSize: 14, color: "var(--sa-ink-soft)", textDecoration: "none" }}>← All posts</a>
      <div id="post">
        <time style={{ fontSize: 13, color: "var(--sa-ink-soft)" }}>{String(p.created).slice(0, 10)}</time>
        <h1>{p.title as string}</h1>
        <p className="lead">{p.excerpt as string}</p>
        <div className="thumb" style={{ minHeight: 260, margin: "16px 0" }}>◉</div>
        <p className="body">{p.body as string}</p>
      </div>
      <div className="rowhead"><h2>More posts</h2><a href="/blog">Show all</a></div>
      <div className="bgrid">
        {more.map((x) => (
          <a className="card postcard" key={x.id as number} href={"/post/" + (x.slug as string)}>
            <div className="thumb">◎</div>
            <div className="body"><time>{String(x.created).slice(0, 10)}</time>
              <h3 style={{ margin: "6px 0" }}>{x.title as string}</h3></div>
          </a>
        ))}
      </div>
    </div>
  );
}
