"use client";

import { useFormState } from "react-dom";
import { requestPasswordReset } from "@/actions/password";

export default function ForgotForm() {
  const [msg, action] = useFormState(requestPasswordReset, null);
  return (
    <div className="card" style={{ maxWidth: 440, margin: "20px auto", padding: 28 }}>
      <h1 style={{ fontSize: 24 }}>Reset password</h1>
      <p style={{ fontSize: 14, color: "var(--sa-ink-soft)", margin: "6px 0 18px" }}>
        Enter your account email and we will send you a one-hour reset link.
      </p>
      <form action={action}>
        <div className="field"><label htmlFor="fp-email">Email</label><input id="fp-email" className="input" name="email" type="email" required autoComplete="email" /></div>
        {msg ? <p role="status" style={{ fontSize: 14, marginBottom: 12 }}>{msg}</p> : null}
        <button className="btn" style={{ width: "100%" }}>Send reset link</button>
      </form>
      <p style={{ fontSize: 13, marginTop: 14 }}><a href="/login" style={{ color: "var(--sa-accent)" }}>Back to sign in</a></p>
    </div>
  );
}
