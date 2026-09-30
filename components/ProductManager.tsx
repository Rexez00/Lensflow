"use client";

import { useState } from "react";
import { money } from "@/lib/format";
import { saveProduct, deleteProduct } from "@/actions/admin";

export type P = {
  id: number; name: string; slug: string; sub: string; price_cents: number;
  old_cents: number | null; cat_id: number | null; catname: string | null;
  stock: number; description: string; active: boolean;
};

export default function ProductManager({ prods, cats }: { prods: P[]; cats: { id: number; name: string }[] }) {
  const blank = { id: 0, name: "", slug: "", sub: "", price: "", old: "", cat: 0, stock: 0, desc: "", active: true };
  const [f, setF] = useState(blank);
  const set = (k: string, v: string | number | boolean) => setF((s) => ({ ...s, [k]: v }));
  const edit = (p: P) => {
    setF({
      id: p.id, name: p.name, slug: p.slug, sub: p.sub, price: String(p.price_cents / 100),
      old: p.old_cents ? String(p.old_cents / 100) : "", cat: p.cat_id ?? 0,
      stock: p.stock, desc: p.description, active: p.active,
    });
    document.getElementById("pform")?.scrollIntoView({ behavior: "smooth" });
  };
  const submit = (fd: FormData) => {
    if (f.id) fd.set("id", String(f.id));
    return saveProduct(fd);
  };
  return (
    <>
      <div className="card" style={{ padding: "8px 22px", marginBottom: 16 }}><div className="twrap"><table>
        <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Active</th><th></th></tr></thead>
        <tbody>
          {prods.map((p) => (
            <tr key={p.id}>
              <td><b>{p.name}</b><br /><small style={{ color: "var(--sa-ink-soft)" }}>{p.slug}</small></td>
              <td>{p.catname ?? "—"}</td><td>{money(p.price_cents)}</td><td>{p.stock}</td><td>{p.active ? "yes" : "no"}</td>
              <td style={{ whiteSpace: "nowrap" }}>
                <button className="btn ghost" style={{ padding: "8px 14px" }} onClick={() => edit(p)}>Edit</button>{" "}
                <button className="btn ghost" style={{ padding: "8px 14px" }}
                  onClick={() => { if (confirm("Delete " + p.name + "?")) deleteProduct(p.id); }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div></div>
      <div className="card" style={{ padding: 22 }} id="pform">
        <h3>{f.id ? "Edit product" : "New product"}</h3>
        <form action={submit} style={{ marginTop: 12 }}>
          <div className="bgrid2">
            <div className="field"><label>Name</label><input className="input" name="name" required value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div className="field"><label>Slug</label><input className="input" name="slug" required value={f.slug} onChange={(e) => set("slug", e.target.value)} /></div>
            <div className="field"><label>Subtitle</label><input className="input" name="sub" value={f.sub} onChange={(e) => set("sub", e.target.value)} /></div>
            <div className="field"><label>Category</label>
              <select className="input" name="cat_id" value={f.cat} onChange={(e) => set("cat", Number(e.target.value))}>
                <option value={0}>—</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></div>
            <div className="field"><label>Price (USD)</label><input className="input" name="price" type="number" min="0" step="0.01" required value={f.price} onChange={(e) => set("price", e.target.value)} /></div>
            <div className="field"><label>Compare price (optional)</label><input className="input" name="old" type="number" min="0" step="0.01" value={f.old} onChange={(e) => set("old", e.target.value)} /></div>
            <div className="field"><label>Stock</label><input className="input" name="stock" type="number" min="0" value={f.stock} onChange={(e) => set("stock", Number(e.target.value))} /></div>
            <div className="field"><label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 26 }}>
              <input type="checkbox" name="active" checked={f.active} onChange={(e) => set("active", e.target.checked)} /> Active</label></div>
          </div>
          <div className="field"><label>Description</label><textarea className="input" name="description" rows={3} value={f.desc} onChange={(e) => set("desc", e.target.value)} /></div>
          <button className="btn">Save product</button>{" "}
          <button type="button" className="btn ghost" onClick={() => setF(blank)}>Clear</button>
        </form>
      </div>
    </>
  );
}
