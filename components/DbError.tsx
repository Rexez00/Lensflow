export default function DbError() {
  return (
    <div className="card" style={{ padding: 40, textAlign: "center", maxWidth: 560 }}>
      <div style={{ fontSize: 44 }}>🔌</div>
      <h1 style={{ fontSize: 24, margin: "12px 0" }}>Store unavailable</h1>
      <p style={{ color: "var(--sa-ink-soft)", fontSize: 14 }}>
        The database isn&apos;t reachable. Check <code>DATABASE_URL</code>, run
        <code> npm run db:migrate</code> and <code>npm run db:seed</code>, then reload.
      </p>
    </div>
  );
}
