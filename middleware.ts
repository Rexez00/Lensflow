import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  // Affiliate referral capture: /register?a=CODE (or any page) → cookie, clean URL.
  const ref = req.nextUrl.searchParams.get("a");
  if (ref && /^[A-Za-z0-9]{4,16}$/.test(ref)) {
    const url = req.nextUrl.clone();
    url.searchParams.delete("a");
    const res = NextResponse.redirect(url);
    res.cookies.set("lf_ref", ref.toUpperCase(), { path: "/", maxAge: 60 * 60 * 24 * 30 });
    return res;
  }
  const p = req.nextUrl.pathname;
  const res = NextResponse.next();
  res.headers.set("x-pathname", p);
  const logged = !!req.auth?.user;
  const role = (req.auth?.user as { role?: string } | undefined)?.role;
  if (p.startsWith("/admin") && (!logged || role !== "admin")) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("next", p);
    return NextResponse.redirect(url);
  }
  if (p.startsWith("/account") && !logged) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("next", p);
    return NextResponse.redirect(url);
  }
  return res;
});

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"] };
