"use server";

import { createHash, randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { sendEmail, siteUrl } from "@/lib/email";

/** Request a password reset link. Always returns the same message (no account enumeration). */
export async function requestPasswordReset(_prev: string | null, form: FormData) {
  const email = String(form.get("email") || "").trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return "Enter a valid email address.";
  try {
    const sql = db();
    await sql`
      CREATE TABLE IF NOT EXISTS password_resets(
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT UNIQUE NOT NULL,
        expires TIMESTAMPTZ NOT NULL,
        used BOOLEAN NOT NULL DEFAULT FALSE,
        created TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    const rows = (await sql`SELECT id FROM users WHERE email = ${email}`) as unknown as { id: number }[];
    const user = rows[0];
    if (user) {
      const token = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      await sql`UPDATE password_resets SET used = TRUE WHERE user_id = ${user.id} AND used = FALSE`;
      await sql`INSERT INTO password_resets(user_id, token_hash, expires)
                VALUES(${user.id}, ${tokenHash}, now() + interval '1 hour')`;
      const link = `${siteUrl()}/reset-password?token=${token}`;
      const r = await sendEmail(
        email,
        "Reset your Simple Lens password",
        `<p>Someone requested a password reset for this account. This link expires in 1 hour:</p><p><a href="${link}">${link}</a></p><p>If that was not you, ignore this email.</p>`
      );
      if (!r.sent) console.log(`[password-reset:dev] ${email} -> ${link}`);
    }
  } catch (e) {
    console.error("[password-reset:error]", e);
  }
  return "If an account uses this email, a reset link is on its way. The link expires in 1 hour.";
}

/** Consume a reset token and set a new password. */
export async function resetPassword(_prev: string | null, form: FormData) {
  const token = String(form.get("token") || "");
  const password = String(form.get("password") || "");
  if (!token) return "Missing reset token.";
  if (password.length < 8) return "Use a password of at least 8 characters.";
  try {
    const sql = db();
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const rows = (await sql`SELECT id, user_id, expires, used FROM password_resets WHERE token_hash = ${tokenHash}`) as unknown as { id: number; user_id: number; expires: string; used: boolean }[];
    const r = (rows as unknown as { id: number; user_id: number; expires: string; used: boolean }[])[0];
    if (!r || r.used || new Date(r.expires).getTime() < Date.now()) return "This reset link is invalid or expired. Request a new one.";
    await sql`UPDATE users SET pw_hash = ${await hash(password, 10)} WHERE id = ${r.user_id}`;
    await sql`UPDATE password_resets SET used = TRUE WHERE id = ${r.id}`;
    return "OK";
  } catch (e) {
    console.error("[password-reset:error]", e);
    return "Something went wrong. Try again.";
  }
}
