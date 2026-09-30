import type { NextAuthConfig } from "next-auth";

/** Edge-safe auth config (no Node APIs, no DB imports) for middleware. */
export const authConfig = {
  trustHost: true,
  providers: [],
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = (user as { id?: string }).id;
        token.role = (user as { role?: string }).role ?? "customer";
      }
      return token;
    },
    async session({ session, token }) {
      const s = session as typeof session & {
        user: { id?: string; role?: string };
      };
      if (token?.uid) s.user.id = String(token.uid);
      if (token?.role) s.user.role = String(token.role);
      return session;
    },
  },
} satisfies NextAuthConfig;
