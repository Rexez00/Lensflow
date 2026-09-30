import { auth } from "@/auth";
import { db , type Row} from "@/lib/db";
import { money } from "@/lib/format";
import { RESELLER_PCT } from "@/lib/shop";
import { resellerApplyAction, resellerBuyAction } from "@/actions/shop";

export const dynamic = "force-dynamic";

export default async function Reseller({ searchParams }: { searchParams: { ok?: string; error?: string } }) {
  const session = await auth();
  const uid = Number((session?.user as { id?: string })?.id);
  const u = ((await db()`SELECT * FROM users WHERE id = ${uid}`)[0] ?? {}) as Row;
  const status = String(u.reseller_status ?? "none");
  const prods = (await db()`SELECT * FROM products WHERE active = TRUE`) as Row[];
  return (
    <>
      <h1 style={{ fontSize: 26 }}>Reseller dashboard</h1>
      <p style={{ color: "var(--sa-ink-soft)", fontSize: 14, margin: "6px 0 20px" }}>Status: <b>{status}</b></p>
      {searchParams.ok ? <div className="card" style={{ padding: 12, marginBottom: 14 }}>Reseller order placed: {searchParams.ok}</div> : null}
      {searchParams.error === "funds" ? <div className="card" style={{ padding: 12, marginBottom: 14 }}>Insufficient balance — <a href="/account/balance" style={{ color: "var(--sa-accent)" }}>top up</a>.</div> : null}
      {status === "none" && (
        <div className="card" style={{ padding: 28, textAlign: "center" }}><h3>Reseller program</h3>
          <p style={{ color: "var(--sa-ink-soft)", fontSize: 14, margin: "8px 0 16px" }}>Buy at {RESELLER_PCT}% off and pay from your balance.</p>
          <form action={resellerApplyAction}><button className="btn">Apply now</button></form></div>
      )}
      {status === "applied" && (
        <div className="card" style={{ padding: 28, textAlign: "center" }}><h3>Application under review</h3>
          <p style={{ color: "var(--sa-ink-soft)" }}>We usually approve within a day.</p></div>
      )}
      {status === "approved" && (
        <div className="card" style={{ padding: "8px 22px" }}><h3 style={{ padding: "14px 0 4px" }}>Catalog — your price (−{RESELLER_PCT}%)</h3>
          <div className="twrap"><table>
            <thead><tr><th>Product</th><th>Retail</th><th>Your price</th><th>Stock</th><th></th></tr></thead>
            <tbody>
              {prods.map((p) => (
                <tr key={p.id as number}>
                  <td><b>{String(p.name)}</b></td>
                  <td style={{ textDecoration: "line-through", color: "var(--sa-ink-soft)" }}>{money(p.price_cents as number)}</td>
                  <td><b style={{ color: "var(--sa-accent)" }}>{money(Math.floor(((p.price_cents as number) * (100 - RESELLER_PCT)) / 100))}</b></td>
                  <td>{Number(p.stock)}</td>
                  <td><form action={resellerBuyAction.bind(null, p.id as number)}>
                    <button className="btn ghost" style={{ padding: "8px 16px" }} disabled={!p.stock}>Buy</button>
                  </form></td>
                </tr>
              ))}
            </tbody>
          </table></div></div>
      )}
    </>
  );
}
