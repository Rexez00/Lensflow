import { getSetting } from "@/lib/orders";
import { saveSettings } from "@/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  const storeName = await getSetting("store_name", "Simple Lens");
  const announcement = await getSetting("announcement", "");
  const contactEmail = await getSetting("contact_email", "");
  const contactPhone = await getSetting("contact_phone", "");
  const maintenance = (await getSetting("maintenance", "0")) === "1";
  return (
    <>
      <h1 style={{ fontSize: 26 }}>Settings</h1>
      <div className="card" style={{ padding: 22, maxWidth: 600, marginTop: 16 }}>
        <form action={saveSettings}>
          <div className="field"><label>Store name</label><input className="input" name="store_name" defaultValue={storeName} /></div>
          <div className="field"><label>Announcement bar</label><input className="input" name="announcement" defaultValue={announcement} /></div>
          <div className="field"><label>Contact email (shown on Contact page &amp; footer)</label><input className="input" name="contact_email" type="email" defaultValue={contactEmail} placeholder="contact@example.ma" /></div>
          <div className="field"><label>Contact phone (shown on Contact page)</label><input className="input" name="contact_phone" defaultValue={contactPhone} placeholder="+212 …" /></div>
          <div className="field"><label>Currency</label><input className="input" value="MAD — Moroccan Dirham (fixed)" disabled /></div>
          <label className="fl"><input type="checkbox" name="maintenance" defaultChecked={maintenance} /> Maintenance mode (storefront hidden for non-admins)</label>
          <div style={{ marginTop: 14 }}><button className="btn">Save settings</button></div>
        </form>
      </div>
    </>
  );
}
