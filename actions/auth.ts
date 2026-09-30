"use server";

import { AuthError } from "next-auth";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { db , type Row} from "@/lib/db";
import { attachCartToUser } from "@/lib/cart";

function code8() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  const buf = new Uint8Array(8);
  crypto.getRandomValues(buf);
  for (const b of buf) s += chars[b % chars.length];
  return s;
}

export async function loginAction(_prev: string | null, form: FormData): Promise<string | null> {
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const next = String(form.get("next") || "/account");
  if (!email || !password) return "Email and password are required.";
  try {
    await signIn("credentials", { email, password, redirectTo: next });
  } catch (e) {
    if (e instanceof AuthError) return "Wrong email or password.";
    throw e;
  }
  return null;
}

export async function registerAction(_prev: string | null, form: FormData): Promise<string | null> {
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const name = String(form.get("name") || "").trim();
  if (!email || password.length < 8) return "Email plus an 8+ character password is required.";
  try {
    const rows = await db()`SELECT id FROM users WHERE email = ${email}`;
    if (rows[0]) return "That email is already registered.";
    // Referral attribution from the cookie set by /register?a=CODE
    const { cookies } = await import("next/headers");
    const refCode = cookies().get("lf_ref")?.value;
    let referredBy: number | null = null;
    if (refCode) {
      const rr = await db()`SELECT id FROM users WHERE affiliate_code = ${refCode}`;
      if (rr[0]) referredBy = (rr[0] as Row).id as number;
    }
    const inserted = await db()`INSERT INTO users(email, pw_hash, name, affiliate_code, referred_by)
      VALUES(${email}, ${await hash(password, 12)}, ${name || email.split("@")[0]}, ${code8()}, ${referredBy}) RETURNING id`;
    await attachCartToUser((inserted[0] as Row).id as number);
    await signIn("credentials", { email, password, redirectTo: "/account" });
  } catch (e) {
    if (e instanceof AuthError) return "Could not sign you in — please log in.";
    throw e;
  }
  return null;
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
