"use client";

import { usePathname } from "next/navigation";

const LINKS = [
  ["/admin", "📊 Dashboard"],
  ["/admin/design", "🎨 Design & Content"],
  ["/admin/orders", "🧾 Orders"],
  ["/admin/products", "📦 Products"],
  ["/admin/categories", "🏷️ Categories"],
  ["/admin/shipping", "🚚 Shipping"],
  ["/admin/payments", "💳 Payments"],
  ["/admin/reviews", "⭐ Reviews"],
  ["/admin/tickets", "💬 Tickets"],
  ["/admin/blog", "📰 Blog"],
  ["/admin/coupons", "🎟️ Coupons"],
  ["/admin/payouts", "💸 Payouts"],
  ["/admin/resellers", "🏪 Resellers"],
  ["/admin/customers", "👥 Customers"],
  ["/admin/settings", "⚙️ Settings"],
] as const;

export default function AdminNav() {
  const path = usePathname();
  return (
    <>
      {LINKS.map(([href, label]) => (
        <a key={href} href={href} className={path === href ? "on" : ""}>{label}</a>
      ))}
      <a href="/">← Storefront</a>
    </>
  );
}
