import { saveVariant, deleteVariantForm, saveImage, deleteImageForm } from "@/actions/admin";
import { money } from "@/lib/format";

export type V = { id: number; product_id: number; pname: string; name: string; sku: string; price_cents: number | null; stock: number | null };
export type I = { id: number; product_id: number; pname: string; url: string; position: number };

export default function ProductExtras({
  prods, variants, images,
}: {
  prods: { id: number; name: string; price_cents: number }[];
  variants: V[];
  images: I[];
}) {
  return (
    <>
      <div className="card" style={{ padding: 22, marginTop: 16 }}>
        <h3>Variants ({variants.length})</h3>
        <p style={{ fontSize: 13, color: "var(--sa-ink-soft)", marginTop: 4 }}>
          Backend-driven options shown on the product page. Empty price/stock inherits the product&apos;s values.
        </p>
        <div className="twrap"><table>
          <thead><tr><th>Product</th><th>Variant</th><th>Price</th><th>Stock</th><th></th></tr></thead>
          <tbody>
            {variants.map((v) => (
              <tr key={v.id}>
                <td>{v.pname}</td>
                <td><b>{v.name}</b>{v.sku ? <><br /><small>{v.sku}</small></> : null}</td>
                <td>{v.price_cents == null ? <small style={{ color: "var(--sa-ink-soft)" }}>inherit</small> : money(v.price_cents)}</td>
                <td>{v.stock == null ? <small style={{ color: "var(--sa-ink-soft)" }}>inherit</small> : v.stock}</td>
                <td>
                  <form action={deleteVariantForm}>
                    <input type="hidden" name="id" value={v.id} />
                    <button className="btn ghost" style={{ padding: "6px 12px" }}>🗑</button>
                  </form>
                </td>
              </tr>
            ))}
            {variants.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center" }}>No variants yet.</td></tr>}
          </tbody>
        </table></div>
        <form action={saveVariant} style={{ marginTop: 12 }}>
          <div className="bgrid2">
            <div className="field"><label>Product</label>
              <select className="input" name="product_id" required defaultValue={prods[0]?.id ?? 0}>
                {prods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select></div>
            <div className="field"><label>Variant name</label><input className="input" name="name" required placeholder="Gift wrapped" /></div>
            <div className="field"><label>SKU (optional)</label><input className="input" name="sku" placeholder="DUO-GIFT" /></div>
            <div className="field"><label>Price override USD (empty = inherit)</label><input className="input" name="price" type="number" min="0" step="0.01" placeholder="" /></div>
            <div className="field"><label>Stock override (empty = inherit)</label><input className="input" name="stock" type="number" min="0" placeholder="" /></div>
          </div>
          <button className="btn" style={{ marginTop: 12 }}>Save variant</button>
        </form>
      </div>

      <div className="card" style={{ padding: 22, marginTop: 16 }}>
        <h3>Gallery images ({images.length})</h3>
        <p style={{ fontSize: 13, color: "var(--sa-ink-soft)", marginTop: 4 }}>Extra product-page photos. The main image URL on the product is always included first.</p>
        <div className="twrap"><table>
          <thead><tr><th>Product</th><th>Image</th><th></th></tr></thead>
          <tbody>
            {images.map((im) => (
              <tr key={im.id}>
                <td>{im.pname}</td>
                <td>
                  <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={im.url} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }} />
                    <small style={{ overflowWrap: "anywhere", maxWidth: 420 }}>{im.url}</small>
                  </span>
                </td>
                <td>
                  <form action={deleteImageForm}>
                    <input type="hidden" name="id" value={im.id} />
                    <button className="btn ghost" style={{ padding: "6px 12px" }}>🗑</button>
                  </form>
                </td>
              </tr>
            ))}
            {images.length === 0 && <tr><td colSpan={3} style={{ textAlign: "center" }}>No extra images yet.</td></tr>}
          </tbody>
        </table></div>
        <form action={saveImage} style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
          <div className="field" style={{ minWidth: 200 }}><label>Product</label>
            <select className="input" name="product_id" required defaultValue={prods[0]?.id ?? 0}>
              {prods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></div>
          <div className="field" style={{ flex: 1, minWidth: 260 }}><label>Image URL</label><input className="input" name="url" required placeholder="https://…" /></div>
          <button className="btn">Add image</button>
        </form>
      </div>
    </>
  );
}
