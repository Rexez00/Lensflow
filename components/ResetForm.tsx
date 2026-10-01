"use client";

import { useFormState } from "react-dom";
import { resetPassword } from "@/actions/password";

export default function ResetForm({ token }: { token: string }) {
  const [msg, action] = useFormState(resetPassword, null);
  if (msg === "OK") {
    return (
      <div className="card" style={{ maxWidth: 440, margin: "20px auto", padding: 28, textAlign: "center" }}>
        <div style={{ fontSize: 40 }}>✓</div>
        <h1 style={{ fontSize: 22, marginTop: 8 }}>Password updated</h1>
        <p style={{ fontSize: 14, color: "var(--sa-ink-soft)", margin: "8px 0 18px" }}>Sign in with your new password.</p>
        <a className="btn" href="/login">Sign in</a>
      </div>
    );
  }
  return (
    <div className="card" style={{ maxWidth: 440, margin: "20px auto", padding: 28 }}>
      <h1 style={{ fontSize: 24 }}>Choose a new password</h1>
      <form action={action} style={{ marginTop: 16 }}>
        <input type="hidden" name="token" value={token} />
        <div className="field"><label htmlFor="rp-pass">New password (min. 8 characters)</label><input id="rp-pass" className="input" name="password" type="password" required minLength={8} autoComplete="new-password" /></div>
        {msg ? <p role="alert" style={{ color: "#C62828", fontSize: 14, marginBottom: 12 }}>{msg}</p> : null}
        <button className="btn" style={{ width: "100%" }}>Update password</button>
      </form>
    </div>
  );
}
