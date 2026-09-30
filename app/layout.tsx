import type { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { getSetting } from "@/lib/orders";
import { readCart } from "@/lib/cart";
import Chrome from "@/components/Chrome";
import SessionProvider from "@/components/SessionProvider";
import "./globals.css";

export const metadata: Metadata = { title: "PocketLens" };
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user as { id?: string; name?: string | null; email?: string; role?: string } | undefined;
  let storeName = "PocketLens";
  let announcement = "";
  let maintenance = false;
  try {
    storeName = await getSetting("store_name", "PocketLens");
    announcement = await getSetting("announcement", "");
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
              storeName={storeName}
              announcement={announcement}
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
