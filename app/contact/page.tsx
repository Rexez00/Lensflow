import { getSetting } from "@/lib/orders";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = { title: "Contact · Simple Lens" };

async function sendMessage(formData: FormData) {
  "use server";
  const name = String(formData.get("name") || "").trim().slice(0, 120);
  const email = String(formData.get("email") || "").trim().slice(0, 160);
  const subject = String(formData.get("subject") || "").trim().slice(0, 160);
  const message = String(formData.get("message") || "").trim().slice(0, 4000);
  if (!name || !email || !message || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error("Please fill in your name, a valid email and a message.");
  }
  const sql = db();
  await sql`
    CREATE TABLE IF NOT EXISTS contact_messages(
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL, email TEXT NOT NULL,
      subject TEXT DEFAULT '', message TEXT NOT NULL,
      created TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
  await sql`INSERT INTO contact_messages(name, email, subject, message) VALUES(${name}, ${email}, ${subject}, ${message})`;
  const { redirect } = await import("next/navigation");
  redirect("/contact?sent=1");
}

export default async function Contact({ searchParams }: { searchParams: { sent?: string } }) {
  const [email, phone] = await Promise.all([
    getSetting("contact_email", "").catch(() => ""),
    getSetting("contact_phone", "").catch(() => ""),
  ]);
  return (
    <>
      <div className="crumbs"><a href="/">Home</a> / <b>Contact</b></div>
      <div className="bgrid2" style={{ alignItems: "start" }}>
        <div className="card" style={{ padding: 28 }}>
          <h1 style={{ fontSize: 28, letterSpacing: "-.02em" }}>Contact us</h1>
          <p style={{ fontSize: 14, color: "var(--sa-ink-soft)", margin: "8px 0 18px" }}>
            Questions about a lens, an order or delivery in Morocco? Write to us — we answer within 1–2 business days.
          </p>
          {searchParams.sent ? (
            <div className="card" role="status" style={{ padding: 18, background: "rgba(46,158,91,.08)", borderColor: "rgba(46,158,91,.3)" }}>
              <b>Message received — thank you.</b>
              <p style={{ fontSize: 14, color: "var(--sa-ink-soft)", marginTop: 6 }}>We will reply to your email shortly.</p>
            </div>
          ) : (
            <form action={sendMessage}>
              <div className="bgrid2">
                <div className="field"><label htmlFor="c-name">Name</label><input id="c-name" className="input" name="name" required autoComplete="name" /></div>
                <div className="field"><label htmlFor="c-email">Email</label><input id="c-email" className="input" name="email" type="email" required autoComplete="email" /></div>
              </div>
              <div className="field"><label htmlFor="c-subject">Subject (optional)</label><input id="c-subject" className="input" name="subject" placeholder="Order question, lens advice…" /></div>
              <div className="field"><label htmlFor="c-message">Message</label><textarea id="c-message" className="input" name="message" rows={5} required /></div>
              <button className="btn" type="submit">Send message</button>
            </form>
          )}
        </div>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 18 }}>Direct contact</h2>
          <div style={{ fontSize: 14, marginTop: 12, lineHeight: 2 }}>
            <div><b>Email:</b> {email ? <a href={"mailto:" + email}>{email}</a> : <span style={{ color: "var(--sa-ink-soft)" }}>[to be added by the store owner in Admin → Settings]</span>}</div>
            <div><b>Phone:</b> {phone ? <a href={"tel:" + phone.replace(/\s/g, "")}>{phone}</a> : <span style={{ color: "var(--sa-ink-soft)" }}>[to be added by the store owner in Admin → Settings]</span>}</div>
            <div><b>Country:</b> Morocco · <b>Currency:</b> MAD</div>
          </div>
          <h2 style={{ fontSize: 18, marginTop: 22 }}>Track an order</h2>
          <p style={{ fontSize: 14, color: "var(--sa-ink-soft)", marginTop: 6 }}>
            Signed in? Find every order and its live status under <a href="/account/orders">My orders</a>.
          </p>
        </div>
      </div>
    </>
  );
}
