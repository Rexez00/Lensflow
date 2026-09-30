export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="card" style={{ maxWidth: 520, margin: "30px auto", padding: 48, textAlign: "center" }}>
      <div style={{ fontSize: 52 }}>🧭</div>
      <h1 style={{ fontSize: 28, margin: "12px 0" }}>Lost your way?</h1>
      <p style={{ color: "var(--sa-ink-soft)" }}>That page doesn&apos;t exist.</p>
      <div style={{ marginTop: 20 }}><a className="btn" href="/">Back home</a></div>
    </div>
  );
}
