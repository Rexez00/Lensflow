import { auth } from "@/auth";
import { db, type Row } from "@/lib/db";
import { saveAddressAction, deleteAddressAction } from "@/actions/shop";

export const dynamic = "force-dynamic";

export default async function AddressesPage({ searchParams }: { searchParams: { error?: string; ok?: string } }) {
  const session = await auth();
  const uid = Number((session?.user as { id?: string })?.id);
  let addrs: Row[] = [];
  try {
    addrs = (await db()`SELECT * FROM addresses WHERE user_id = ${uid} ORDER BY id`) as Row[];
  } catch { addrs = []; }
  return (
    <>
      <h1 style={{ fontSize: 26 }}>Saved addresses</h1>
      <p style={{ color: "var(--sa-ink-soft)", fontSize: 14, margin: "6px 0 20px" }}>
        Used to pre-fill checkout. Morocco-first defaults.
      </p>
      {searchParams.error === "required" && <div className="card" role="alert" style={{ padding: 12, marginBottom: 12 }}>Name, phone, street and city are required.</div>}
      {searchParams.ok === "saved" && <div className="card" role="status" style={{ padding: 12, marginBottom: 12 }}>Address saved.</div>}
      <div className="bgrid2">
        {addrs.map((a) => (
          <div className="card" style={{ padding: 18 }} key={a.id as number}>
            <b>{String(a.label || "Address")}</b>
            <p style={{ fontSize: 14, marginTop: 8 }}>
              {String(a.full_name)}<br />{String(a.line1)}{a.line2 ? `, ${String(a.line2)}` : ""}<br />
              {String(a.city)}{a.postal ? ` ${String(a.postal)}` : ""}, {String(a.country)}<br />
              <small style={{ color: "var(--sa-ink-soft)" }}>{String(a.phone)}</small>
            </p>
            <form action={deleteAddressAction.bind(null, a.id as number)} style={{ marginTop: 10 }}>
              <button className="btn ghost" style={{ padding: "8px 14px" }}>Delete</button>
            </form>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 22, marginTop: 16 }}>
        <h3>Add address</h3>
        <form action={saveAddressAction} style={{ marginTop: 12 }}>
          <div className="bgrid2">
            <div className="field"><label>Label</label><input className="input" name="label" placeholder="Home" defaultValue="Home" /></div>
            <div className="field"><label>Full name</label><input className="input" name="full_name" required placeholder="Yasmine El Amrani" /></div>
            <div className="field"><label>Phone</label><input className="input" name="phone" required placeholder="+212 6 xx xx xx xx" /></div>
            <div className="field"><label>Country</label><input className="input" name="country" defaultValue="Morocco" /></div>
            <div className="field" style={{ gridColumn: "1 / -1" }}><label>Street</label><input className="input" name="line1" required placeholder="12 Rue Mohammed V" /></div>
            <div className="field" style={{ gridColumn: "1 / -1" }}><label>Apartment (optional)</label><input className="input" name="line2" /></div>
            <div className="field"><label>City</label><input className="input" name="city" required placeholder="Casablanca" /></div>
            <div className="field"><label>Region (optional)</label><input className="input" name="region" /></div>
            <div className="field"><label>Postal code (optional)</label><input className="input" name="postal" /></div>
          </div>
          <button className="btn" style={{ marginTop: 12 }}>Save address</button>
        </form>
      </div>
    </>
  );
}
