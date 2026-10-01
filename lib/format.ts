/** Prices are stored as integer cents (MAD). Rendered with fr-MA grouping + MAD suffix. */
export const money = (cents: number | null | undefined) => {
  const v = (cents ?? 0) / 100;
  try {
    return new Intl.NumberFormat("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) + " MAD";
  } catch {
    return v.toFixed(2) + " MAD";
  }
};

/** Parse a MAD amount typed by a human ("1299", "1 299,50") into integer cents. */
export const madToCents = (raw: string | null | undefined): number => {
  const s = String(raw ?? "").replace(/[^0-9.,]/g, "").replace(",", ".");
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
};
