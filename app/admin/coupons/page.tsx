import { db , type Row} from "@/lib/db";
import { money } from "@/lib/format";
import { saveCoupon, toggleCoupon, deleteCoupon } from "@/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminCoupons() {
  const rows = (await db()`SELECT * FROM coupons ORDER BY id DESC`) as Row[];
  return (
    <>
      <h1 style={{ fontSize: 26 }}>Coupons</h1>
      <div className="card" style={{ padding: "8px 22px", margin: "16px 0" }}><div className="twrap"><table>
        <thead><tr><th>Code</th><th>Off</th><th>Min</th><th>Active</th><th></th></tr></thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id as number}>
              <td><b>{String(c.code)}</b></td><td>{Number(c.pct)}%</td><td>{money(c.min_cents as number)}</td>
              <td>{c.active ? "yes" : "no"}</td>
              <td style={{ whiteSpace: "nowrap" }}>
                <form action={toggleCoupon.bind(null, c.id as number)} style={{ display: "inline" }}>
                  <button className="btn ghost" style={{ padding: "8px 14px" }}>{c.active ? "Disable" : "Enable"}</button>
                </form>{" "}
                <form action={deleteCoupon.bind(null, c.id as number)} style={{ display: "inline" }}>
                  <button className="btn ghost" style={{ padding: "8px 14px" }}>Delete</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div></div>
      <div className="card" style={{ padding: 22, maxWidth: 560 }}><h3>New coupon</h3>
        <form action={saveCoupon} style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <input className="input" name="code" placeholder="CODE" required style={{ maxWidth: 160 }} />
          <input className="input" name="pct" type="number" min="1" max="90" defaultValue="10" style={{ maxWidth: 110 }} />
          <input className="input" name="min" type="number" min="0" step="0.01" placeholder="Min $" style={{ maxWidth: 130 }} />
          <button className="btn">Create</button>
        </form></div>
    </>
  );
}
