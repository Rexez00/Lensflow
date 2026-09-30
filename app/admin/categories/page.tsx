import { db , type Row} from "@/lib/db";
import { saveCategory, deleteCategory } from "@/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminCats() {
  const cats = (await db()`SELECT * FROM categories`) as Row[];
  return (
    <>
      <h1 style={{ fontSize: 26 }}>Categories</h1>
      <div className="card" style={{ padding: 22, maxWidth: 560, marginTop: 16 }}>
        {cats.map((c, i) => (
          <div key={c.id as number} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 0", borderTop: i ? "1px solid var(--sa-line)" : 0 }}>
            <b style={{ flex: 1 }}>{String(c.name)}</b>
            <small style={{ color: "var(--sa-ink-soft)" }}>{String(c.slug)}</small>
            <form action={deleteCategory.bind(null, c.id as number)}>
              <button className="btn ghost" style={{ padding: "8px 14px" }}>Delete</button>
            </form>
          </div>
        ))}
        <form action={saveCategory} style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <input className="input" name="name" placeholder="New category name" required />
          <button className="btn">Add</button>
        </form>
      </div>
    </>
  );
}
