"use client";

import { savePost, deletePost } from "@/actions/admin";

export type Post = { id: number; slug: string; title: string; excerpt: string; body: string };

export default function BlogManager({ posts, edit }: { posts: Post[]; edit: Post | null }) {
  return (
    <>
      <div className="card" style={{ padding: "8px 22px", margin: "16px 0" }}>
        {posts.map((p, i) => (
          <div key={p.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 0", borderTop: i ? "1px solid var(--sa-line)" : 0 }}>
            <b style={{ flex: 1 }}>{p.title}<br /><small style={{ color: "var(--sa-ink-soft)" }}>/{p.slug}</small></b>
            <a className="btn ghost" style={{ padding: "8px 14px" }} href={"/admin/blog?edit=" + p.id}>Edit</a>
            <button className="btn ghost" style={{ padding: "8px 14px" }}
              onClick={() => { if (confirm("Delete?")) deletePost(p.id); }}>Delete</button>
          </div>
        ))}
        {posts.length === 0 && <p style={{ padding: 20, textAlign: "center", color: "var(--sa-ink-soft)" }}>No posts.</p>}
      </div>
      <div className="card" style={{ padding: 22 }}><h3>{edit ? "Edit post" : "New post"}</h3>
        <form action={savePost} style={{ marginTop: 12 }}>
          {edit ? <input type="hidden" name="id" value={edit.id} /> : null}
          <div className="field"><label>Title</label><input className="input" name="title" defaultValue={edit?.title ?? ""} required /></div>
          <div className="field"><label>Slug (optional)</label><input className="input" name="slug" defaultValue={edit?.slug ?? ""} placeholder="auto from title" /></div>
          <div className="field"><label>Excerpt</label><input className="input" name="excerpt" defaultValue={edit?.excerpt ?? ""} /></div>
          <div className="field"><label>Body</label><textarea className="input" name="body" rows={6} defaultValue={edit?.body ?? ""} /></div>
          <button className="btn">Save</button>{" "}
          {edit ? <a className="btn ghost" href="/admin/blog">New</a> : null}
        </form></div>
    </>
  );
}
