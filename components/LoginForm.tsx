"use client";

import { useFormState } from "react-dom";
import { loginAction } from "@/actions/auth";

export default function LoginForm({ next }: { next: string }) {
  const [error, action] = useFormState(loginAction, null);
  return (
    <div className="card" style={{ maxWidth: 440, margin: "20px auto", padding: 28 }}>
      <h1 style={{ fontSize: 24 }}>Sign in</h1>
      <p style={{ fontSize: 14, color: "var(--sa-ink-soft)", margin: "6px 0 18px" }}>
        Admin? Use your admin email — you&apos;ll land in the dashboard.
      </p>
      <form action={action}>
        <input type="hidden" name="next" value={next} />
        <div className="field"><label>Email</label><input className="input" name="email" type="email" required /></div>
        <div className="field"><label>Password</label><input className="input" name="password" type="password" required /></div>
        {error ? <p style={{ color: "#C62828", fontSize: 14, marginBottom: 12 }}>{error}</p> : null}
        <button className="btn" style={{ width: "100%" }}>Sign in</button>
      </form>
      <p style={{ fontSize: 13, marginTop: 14 }}>New here? <a href="/register" style={{ color: "var(--sa-accent)" }}>Create an account</a></p>
      <p style={{ fontSize: 13, marginTop: 6 }}><a href="/forgot-password" style={{ color: "var(--sa-ink-soft)" }}>Forgot your password?</a></p>
    </div>
  );
}
