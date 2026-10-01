import type { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { getSetting } from "@/lib/orders";
import { getSiteTheme, THEME_DEFAULTS } from "@/lib/theme";
import { readCart } from "@/lib/cart";
import Chrome from "@/components/Chrome";
import SessionProvider from "@/components/SessionProvider";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const name = await getSetting("store_name", "Simple Lens");
    const tagline = "Pocket-size fisheye and macro lenses for your phone. Morocco, priced in MAD.";
    return {
      title: { default: name, template: `%s · ${name}` },
      description: tagline,
      openGraph: { title: name, description: tagline, type: "website", locale: "fr_MA" },
    };
  } catch {
    return { title: "Simple Lens", description: "Pocket-size phone lenses. Morocco, priced in MAD." };
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user as { id?: string; name?: string | null; email?: string; role?: string } | undefined;
  let theme = THEME_DEFAULTS;
  let maintenance = false;
  try {
    theme = await getSiteTheme();
    maintenance = (await getSetting("maintenance", "0")) === "1";
  } catch {
    /* build without DB: chrome renders, pages show a clear error */
  }
  const cart = await readCart().catch(() => null);
  const path = headers().get("x-pathname") ?? "";
  const locked =
    maintenance && user?.role !== "admin" && path !== "/login" && !path.startsWith("/api/") && !path.startsWith("/_next");
  return (
    <html lang="en" data-scheme="light" suppressHydrationWarning>
      <body data-page="app">
        <SessionProvider>
          {locked ? (
            <div className="app" style={{ alignItems: "center", justifyContent: "center", textAlign: "center", padding: "80px 20px" }}>
              <div style={{ maxWidth: 420 }}>
                <div className="card" style={{ display: "inline-block", padding: 20, marginBottom: 20, fontSize: 48 }}>⚙️</div>
                <h1 style={{ fontSize: 32 }}>We&apos;ll be right back</h1>
                <p style={{ color: "var(--sa-ink-soft)", margin: "10px 0 24px" }}>
                  Scheduled maintenance. Admins can still <a href="/login" style={{ color: "var(--sa-accent)" }}>sign in</a>.
                </p>
              </div>
            </div>
          ) : (
            <Chrome
              user={user ? { name: user.name ?? null, email: user.email ?? "", role: user.role ?? "customer" } : null}
              storeName={theme.store_name}
              announcement={theme.announcement}
              logoUrl={theme.logo_url}
              accentColor={theme.accent_color}
              footerTagline={theme.footer_tagline}
              cartCount={(cart?.items ?? []).reduce((n, i) => n + i.qty, 0)}
            >
              {children}
            </Chrome>
          )}
        </SessionProvider>
      </body>
    </html>
  );
}
