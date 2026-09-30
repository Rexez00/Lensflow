import { db , type Row} from "@/lib/db";
import { safe } from "@/lib/server";
import DbError from "@/components/DbError";

export const dynamic = "force-dynamic";

export default async function Status() {
  const { data, down } = await safe(async () => db()`SELECT name, slug, stock FROM products WHERE active = TRUE`);
  if (down || !data) return <DbError />;
  const items = data as unknown as Row[];
  return (
    <>
      <div className="crumbs"><a href="/">Home</a> / <b>Status</b></div>
      <div style={{ maxWidth: 720 }}>
        <h1 style={{ fontSize: 30, letterSpacing: "-.02em", marginBottom: 18 }}>Availability</h1>
        <div className="card">
          {items.map((it, i) => (
            <a className="statusrow pick" key={it.slug as string} href={"/product/" + (it.slug as string)}
              style={{ border: 0, boxShadow: "none", margin: 0, borderRadius: 0, ...(i ? { borderTop: "1px solid var(--sa-line)" } : {}) }}>
              <span className="dot" style={!it.stock ? { background: "#C62828", boxShadow: "0 0 0 4px rgba(198,40,40,.15)" } : undefined} />
              <b style={{ flex: 1 }}>{it.name as string}</b>
              <span style={{ fontSize: 13, color: it.stock ? "#2E9E5B" : "#C62828" }}>{it.stock ? "In stock" : "Restocking"}</span>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
