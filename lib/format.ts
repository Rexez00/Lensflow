export const money = (cents: number | null | undefined) =>
  "$" + ((cents ?? 0) / 100).toFixed(2);
