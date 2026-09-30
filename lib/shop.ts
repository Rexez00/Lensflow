export const money = (cents: number | null | undefined) =>
  "$" + ((cents ?? 0) / 100).toFixed(2);

export const RESELLER_PCT = 15;
export const AFFILIATE_PCT = 10;

export const PLANS = [
  { slug: "lens-club", name: "Lens Club", price: 900, interval: "month" },
  { slug: "care-plan", name: "Care Plan", price: 2900, interval: "year" },
] as const;

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}
