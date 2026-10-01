import { db, type Row } from "@/lib/db";
import { money } from "@/lib/format";
import { saveShippingMethod, toggleShippingForm, deleteShippingForm } from "@/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminShipping() {
  let methods: Row[] = [];
  try {
    methods = (await db()`SELECT * FROM shipping_methods ORDER BY position, id`) as Row[];
  } catch { methods = []; }
  return (
    <>
      <h1 style={{ fontSize: 26 }}>Shipping</h1>
      <p style={{ color: "var(--sa-ink-soft)", fontSize: 14, margin: "6px 0 20px" }}>
        Methods offered at checkout. Prices are authoritative — checkout never trusts the browser.
      </p>
      <div className="card" style={{ padding: "8px 22px", marginBottom: 16 }}><div className="twrap"><table>
        <thead><tr><th>Method</th><th>Price</th><th>ETA</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {methods.map((m) => (
            <tr key={m.id as number}>
              <td><b>{String(m.name)}</b><br /><small style={{ color: "var(--sa-ink-soft)" }}>{String(m.description ?? "")}</small></td>
              <td>{money(m.price_cents as number)}</td>
              <td>{String(m.eta ?? "")}</td>
              <td>{m.active ? <span className="status-pill st-ok">live</span> : <span className="status-pill st-mut">off</span>}</td>
              <td style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                <span style={{ display: "inline-flex", gap: 6 }}>
                  <form action={toggleShippingForm}>
                    <input type="hidden" name="id" value={m.id as number} />
                    <button className="btn ghost" style={{ padding: "8px 12px" }}>{(m.active as boolean) ? "Disable" : "Enable"}</button>
                  </form>
                  <form action={deleteShippingForm}>
                    <input type="hidden" name="id" value={m.id as number} />
                    <button className="btn ghost" style={{ padding: "8px 12px" }}>🗑</button>
                  </form>
                </span>
              </td>
            </tr>
          ))}
          {methods.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center" }}>No methods yet.</td></tr>}
        </tbody>
      </table></div></div>
      <div className="card" style={{ padding: 22 }}>
        <h3>Add / update method</h3>
        <form action={saveShippingMethod} style={{ marginTop: 12 }}>
          <div className="bgrid2">
            <div className="field"><label>Name</label><input className="input" name="name" required placeholder="Standard" /></div>
            <div className="field"><label>ETA</label><input className="input" name="eta" placeholder="3–5 days" /></div>
            <div className="field"><label>Price (MAD)</label><input className="input" name="price" type="number" min="0" step="0.01" defaultValue="0" /></div>
            <div className="field"><label>Description</label><input className="input" name="description" placeholder="Tracked 3–5 business days" /></div>
          </div>
          <button className="btn" style={{ marginTop: 12 }}>Save method</button>
        </form>
      </div>
    </>
  );
}
