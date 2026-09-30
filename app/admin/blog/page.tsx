import { db , type Row} from "@/lib/db";
import BlogManager from "@/components/BlogManager";

export const dynamic = "force-dynamic";

export default async function AdminBlog({ searchParams }: { searchParams: { edit?: string } }) {
  const sql = db();
  const posts = (await sql`SELECT * FROM posts ORDER BY id DESC`) as Row[];
  let edit = null;
  if (searchParams.edit) {
    const r = await sql`SELECT * FROM posts WHERE id = ${Number(searchParams.edit)}`;
    edit = (r[0] ?? null) as Row | null;
  }
  return (
    <>
      <h1 style={{ fontSize: 26 }}>Blog posts</h1>
      <BlogManager
        posts={posts.map((p) => ({ id: p.id as number, slug: String(p.slug), title: String(p.title), excerpt: String(p.excerpt ?? ""), body: String(p.body ?? "") }))}
        edit={edit ? { id: edit.id as number, slug: String(edit.slug), title: String(edit.title), excerpt: String(edit.excerpt ?? ""), body: String(edit.body ?? "") } : null}
      />
    </>
  );
}
