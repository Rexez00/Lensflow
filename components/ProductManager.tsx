"use client";

import { useMemo, useState } from "react";
import { money } from "@/lib/format";
import { saveProduct, deleteProduct, duplicateProduct, toggleFeatured, quickStock } from "@/actions/admin";

export type P = {
  id: number; name: string; slug: string; sub: string; price_cents: number;
  old_cents: number | null; cat_id: number | null; catname: string | null;
  stock: number; description: string; active: boolean;
  image_url: string; badge: string; featured: boolean;
};

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1500634245200-e5245c7574ef?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1519638831568-d9897f54ed69?auto=format&fit=crop&w=800&q=80",
];

export default function ProductManager({ prods, cats }: { prods: P[]; cats: { id: number; name: string }[] }) {
  const blank = { id: 0, name: "", slug: "", sub: "", price: "", old: "", cat: 0, stock: 20, desc: "", active: true, featured: false, image: "", badge: "" };
  const [f, setF] = useState(blank);
  const [q, setQ] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const set = (k: string, v: string | number | boolean) => setF((s) => ({ ...s, [k]: v }));

  const filtered = useMemo(() => {
    return prods.filter((p) => {
      if (onlyLow && p.stock >= 10) return false;
      if (!q) return true;
      const s = (p.name + " " + p.slug + " " + (p.catname ?? "")).toLowerCase();
      return s.includes(q.toLowerCase());
    });
  }, [prods, q, onlyLow]);

  const edit = (p: P) => {
    setF({
      id: p.id, name: p.name, slug: p.slug, sub: p.sub, price: String(p.price_cents / 100),
      old: p.old_cents ? String(p.old_cents / 100) : "", cat: p.cat_id ?? 0,
      stock: p.stock, desc: p.description, active: p.active, featured: p.featured,
      image: p.image_url, badge: p.badge,
    });
    document.getElementById("pform")?.scrollIntoView({ behavior: "smooth" });
  };

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const submit = (fd: FormData) => {
    if (f.id) fd.set("id", String(f.id));
    fd.set("image_url", f.image);
    fd.set("badge", f.badge);
    if (f.featured) fd.set("featured", "on");
    return saveProduct(fd);
  };

  return (
    <>
      <div className="card" style={{ padding: 16, marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input className="input" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 260 }} />
        <label style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} /> Low stock only
        </label>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--sa-ink-soft)" }}>{filtered.length} / {prods.length} shown</span>
        <button className="btn ghost" style={{ padding: "8px 14px" }} onClick={() => setF(blank)}>+ New product</button>
      </div>

      <div className="card" style={{ padding: "8px 22px", marginBottom: 16 }}><div className="twrap"><table id="product-table">
        <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {filtered.map((p) => (
            <tr key={p.id}>
              <td>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--sa-media-bg)", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : <span style={{ fontSize: 20 }}>◎</span>}
                  </div>
                  <div>
                    <b>{p.name}</b> {p.featured ? <span className="status-pill st-info">★ featured</span> : null} {p.badge ? <span className="status-pill st-warn">{p.badge}</span> : null}<br />
                    <small style={{ color: "var(--sa-ink-soft)" }}>{p.slug} · {p.catname ?? "no cat"}</small>
                  </div>
                </div>
              </td>
              <td>{money(p.price_cents)}</td>
              <td>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button className="iconbtn" style={{ width: 28, height: 28 }} onClick={() => quickStock(p.id, p.stock - 1)}>−</button>
                  <b>{p.stock}</b>
                  <button className="iconbtn" style={{ width: 28, height: 28 }} onClick={() => quickStock(p.id, p.stock + 1)}>+</button>
                </div>
              </td>
              <td>{p.active ? <span className="status-pill st-ok">live</span> : <span className="status-pill st-mut">hidden</span>}</td>
              <td style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                <button className="btn ghost" style={{ padding: "8px 12px" }} onClick={() => edit(p)}>Edit</button>{" "}
                <button className="btn ghost" style={{ padding: "8px 12px" }} onClick={() => toggleFeatured(p.id)} title="Toggle homepage feature">★</button>{" "}
                <button className="btn ghost" style={{ padding: "8px 12px" }} onClick={() => { if (confirm("Duplicate " + p.name + "?")) duplicateProduct(p.id); }}>⧉</button>{" "}
                <button className="btn ghost" style={{ padding: "8px 12px" }}
                  onClick={() => { if (confirm("Delete " + p.name + "?")) deleteProduct(p.id); }}>🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div></div>

      <div className="card" style={{ padding: 22 }} id="pform">
        <h3>{f.id ? "Edit product" : "New product"}</h3>
        <p style={{ fontSize: 13, color: "var(--sa-ink-soft)", marginTop: 4 }}>Add photos via image URL — paste any link or pick a sample below. Changes go live instantly.</p>
        <form action={submit} style={{ marginTop: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ width: "100%", aspectRatio: "1", borderRadius: 16, background: "var(--sa-media-bg)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--sa-line)" }}>
                {f.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.image} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
                ) : <span style={{ fontSize: 48, color: "var(--sa-ink-soft)" }}>◎</span>}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {SAMPLE_IMAGES.map((u) => (
                  <button key={u} type="button" onClick={() => set("image", u)} style={{ width: 38, height: 38, borderRadius: 8, overflow: "hidden", border: f.image === u ? "2px solid var(--sa-accent)" : "1px solid var(--sa-line)", padding: 0, cursor: "pointer" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="bgrid2">
                <div className="field"><label>Name</label><input className="input" name="name" required value={f.name} onChange={(e) => { set("name", e.target.value); if (!f.id) set("slug", autoSlug(e.target.value)); }} /></div>
                <div className="field"><label>Slug</label><input className="input" name="slug" required value={f.slug} onChange={(e) => set("slug", e.target.value)} /></div>
                <div className="field" style={{ gridColumn: "1 / -1" }}><label>Image URL</label><input className="input" name="image_url" value={f.image} onChange={(e) => set("image", e.target.value)} placeholder="https://…" /></div>
                <div className="field"><label>Subtitle</label><input className="input" name="sub" value={f.sub} onChange={(e) => set("sub", e.target.value)} /></div>
                <div className="field"><label>Badge (e.g. Bestseller, New, -20%)</label><input className="input" name="badge" value={f.badge} onChange={(e) => set("badge", e.target.value)} placeholder="Optional" /></div>
                <div className="field"><label>Category</label>
                  <select className="input" name="cat_id" value={f.cat} onChange={(e) => set("cat", Number(e.target.value))}>
                    <option value={0}>—</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select></div>
                <div className="field"><label>Price (USD)</label><input className="input" name="price" type="number" min="0" step="0.01" required value={f.price} onChange={(e) => set("price", e.target.value)} /></div>
                <div className="field"><label>Compare price (optional)</label><input className="input" name="old" type="number" min="0" step="0.01" value={f.old} onChange={(e) => set("old", e.target.value)} /></div>
                <div className="field"><label>Stock</label><input className="input" name="stock" type="number" min="0" value={f.stock} onChange={(e) => set("stock", Number(e.target.value))} /></div>
              </div>
            </div>
          </div>
          <div className="field"><label>Description</label><textarea className="input" name="description" rows={3} value={f.desc} onChange={(e) => set("desc", e.target.value)} /></div>
          <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
            <label className="fl"><input type="checkbox" name="active" checked={f.active} onChange={(e) => set("active", e.target.checked)} /> Active (visible in store)</label>
            <label className="fl"><input type="checkbox" name="featured" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} /> ★ Featured on homepage</label>
          </div>
          <button className="btn">Save product</button>{" "}
          <button type="button" className="btn ghost" onClick={() => setF(blank)}>Clear</button>
        </form>
      </div>
    </>
  );
}
