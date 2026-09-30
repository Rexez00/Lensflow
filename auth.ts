import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { authConfig } from "./auth.config";
import { db, type Row } from "./lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        const email = String(creds?.email || "").trim().toLowerCase();
        const password = String(creds?.password || "");
        if (!email || !password) return null;
        const rows = await db()`SELECT * FROM users WHERE email = ${email}`;
        const u = rows[0] as Row | undefined;
        if (!u || typeof u.pw_hash !== "string") return null;
        if (!(await compare(password, u.pw_hash))) return null;
        return {
          id: String(u.id),
          email: u.email as string,
          name: (u.name as string) || null,
          role: u.role as string,
        };
      },
    }),
  ],
});
