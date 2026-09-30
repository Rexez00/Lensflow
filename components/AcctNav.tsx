"use client";

import { usePathname } from "next/navigation";

const LINKS = [
  ["/account", "◔ Dashboard"],
  ["/account/orders", "🧾 Orders"],
  ["/account/addresses", "📍 Addresses"],
  ["/account/subscriptions", "🔁 Subscriptions"],
  ["/account/tickets", "💬 Tickets"],
  ["/account/balance", "💰 Balance"],
  ["/account/affiliate", "🤝 Affiliate"],
  ["/account/reseller", "🏪 Reseller"],
] as const;

export default function AcctNav({ logout }: { logout: () => void }) {
  const path = usePathname();
  return (
    <>
      {LINKS.map(([href, label]) => (
        <a key={href} href={href} className={path === href ? "on" : ""}>{label}</a>
      ))}
      <form action={logout}>
        <button style={{ background: "none", border: 0, cursor: "pointer", fontSize: 14, padding: "11px 12px", textAlign: "left", color: "inherit", fontFamily: "inherit" }}>⏻ Logout</button>
      </form>
    </>
  );
}
