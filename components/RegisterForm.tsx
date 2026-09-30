"use client";

import { useFormState } from "react-dom";
import { registerAction } from "@/actions/auth";

export default function RegisterForm() {
  const [error, action] = useFormState(registerAction, null);
  return (
    <div className="card" style={{ maxWidth: 440, margin: "20px auto", padding: 28 }}>
      <h1 style={{ fontSize: 24 }}>Create account</h1>
      <p style={{ fontSize: 14, color: "var(--sa-ink-soft)", margin: "6px 0 18px" }}>Orders, tickets, balance and referrals live here.</p>
      <form action={action}>
        <div className="field"><label>Name</label><input className="input" name="name" /></div>
        <div className="field"><label>Email</label><input className="input" name="email" type="email" required /></div>
        <div className="field"><label>Password (8+ characters)</label><input className="input" name="password" type="password" minLength={8} required /></div>
        {error ? <p style={{ color: "#C62828", fontSize: 14, marginBottom: 12 }}>{error}</p> : null}
        <button className="btn" style={{ width: "100%" }}>Create account</button>
      </form>
      <p style={{ fontSize: 13, marginTop: 14 }}>Have an account? <a href="/login" style={{ color: "var(--sa-accent)" }}>Sign in</a></p>
    </div>
  );
}
