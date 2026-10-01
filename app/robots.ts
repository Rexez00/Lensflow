import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const b = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/api/", "/checkout/success", "/pay/"] }],
    sitemap: `${b}/sitemap.xml`,
  };
}
