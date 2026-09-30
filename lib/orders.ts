import { db , type Row} from "./db";
import { AFFILIATE_PCT, RESELLER_PCT } from "./shop";

export type Totals = { total: number; discount: number; couponCode: string };

/** Server-side totals from authoritative DB state. Never trusts the browser. */
export async function checkoutTotals(
  subtotal: number,
  user: { reseller_status?: string } | null,
  couponCode: string
): Promise<Totals> {
  let discount = 0;
  let code = "";
  if (user?.reseller_status === "approved") {
    discount += Math.floor((subtotal * RESELLER_PCT) / 100);
  }
  const c = couponCode.trim().toUpperCase();
  if (c) {
    const rows = await db()`SELECT * FROM coupons WHERE code = ${c} AND active = TRUE`;
    const coupon = rows[0] as Row | undefined;
    if (coupon && subtotal >= ((coupon.min_cents as number) ?? 0)) {
      code = c;
      discount += Math.floor(((subtotal - discount) * (coupon.pct as number)) / 100);
    }
  }
  return { total: Math.max(0, subtotal - discount), discount, couponCode: code };
}

/** Idempotent payment completion: stock, top-ups, subscriptions, commissions. */
export async function markPaid(orderId: number) {
  const sql = db();
  return sql.begin(async (tx) => {
    const rows = await tx`SELECT * FROM orders WHERE id = ${orderId}`;
    const o = rows[0] as Row | undefined;
    if (!o || o.status !== "pending") return o ?? null;
    await tx`UPDATE orders SET status = 'paid' WHERE id = ${orderId}`;
    const items = (await tx`SELECT * FROM order_items WHERE order_id = ${orderId}`) as Row[];
    for (const it of items) {
      if (it.product_id) {
        await tx`UPDATE products SET stock = GREATEST(0, stock - ${it.qty}) WHERE id = ${it.product_id}`;
      }
    }
    if (o.kind === "topup" && o.user_id) {
      await tx`UPDATE users SET balance_cents = balance_cents + ${o.total_cents} WHERE id = ${o.user_id}`;
      await tx`INSERT INTO transactions(user_id, kind, label, amount_cents) VALUES(${o.user_id}, 'topup', ${"Balance top-up " + o.code}, ${o.total_cents})`;
    }
    if (o.kind === "shop" && typeof o.meta === "string" && o.meta.startsWith("sub:")) {
      await tx`UPDATE subscriptions SET status = 'active' WHERE id = ${Number(o.meta.slice(4))}`;
    }
    if (o.user_id) {
      const buyers = (await tx`SELECT referred_by FROM users WHERE id = ${o.user_id}`) as Row[];
      const ref = buyers[0]?.referred_by as number | null;
      if (ref && o.kind === "shop") {
        const cut = Math.floor(((o.total_cents as number) * AFFILIATE_PCT) / 100);
        if (cut > 0) {
          await tx`UPDATE users SET balance_cents = balance_cents + ${cut} WHERE id = ${ref}`;
          await tx`INSERT INTO transactions(user_id, kind, label, amount_cents) VALUES(${ref}, 'commission', ${"Referral commission " + o.code}, ${cut})`;
        }
      }
    }
    const done = await tx`SELECT * FROM orders WHERE id = ${orderId}`;
    return (done[0] ?? null) as Row | null;
  });
}

export async function getSetting(key: string, fallback = "") {
  const rows = await db()`SELECT value FROM settings WHERE key = ${key}`;
  return ((rows[0] as Row | undefined)?.value as string) ?? fallback;
}
