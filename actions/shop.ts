"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db , type Row} from "@/lib/db";
import { enrichCart, getOrCreateCart, clearCart } from "@/lib/cart";
import { checkoutTotals, markPaid } from "@/lib/orders";
import { createCheckoutSession } from "@/lib/stripe";
import { PLANS } from "@/lib/shop";

type Me = { id: string } | undefined;

async function me(): Promise<Me> {
  const s = await auth();
  const u = s?.user as { id?: string } | undefined;
  return u?.id ? { id: u.id } : undefined;
}

async function meRow() {
  const m = await me();
  if (!m) return null;
  const rows = await db()`SELECT * FROM users WHERE id = ${Number(m.id)}`;
  return (rows[0] ?? null) as Row | null;
}

export async function setCouponAction(form: FormData) {
  const cart = await getOrCreateCart();
  cart.coupon = String(form.get("coupon") || "").trim().toUpperCase().slice(0, 32);
  const { saveCart } = await import("@/lib/cart");
  await saveCart(cart);
  redirect("/checkout");
}

export async function placeOrderAction() {
  const cart = await getOrCreateCart();
  const { lines, total: subtotal } = await enrichCart(cart);
  if (!lines.length) redirect("/cart");
  const sql = db();
  const user = await meRow();
  // Stock validation against authoritative rows
  for (const l of lines) {
    const r = await sql`SELECT stock FROM products WHERE id = ${l.id} AND active = TRUE`;
    const row = r[0] as Row | undefined;
    if (!row || (row.stock as number) < l.qty) redirect("/cart?error=stock");
  }
  const { total, discount, couponCode } = await checkoutTotals(
    subtotal, user ? { reseller_status: String(user.reseller_status ?? "none") } : null, cart.coupon);
  const email = user ? String(user.email) : "";
  const uid = user ? Number(user.id) : null;
  const order = await sql.begin(async (tx) => {
    const ins = await tx`INSERT INTO orders(user_id, email, kind, subtotal_cents, discount_cents, total_cents, coupon)
      VALUES(${uid}, ${email}, 'shop', ${subtotal}, ${discount}, ${total}, ${couponCode}) RETURNING id`;
    const oid = (ins[0] as Row).id as number;
    const code = "PL-" + (9000 + oid);
    await tx`UPDATE orders SET code = ${code} WHERE id = ${oid}`;
    for (const l of lines) {
      await tx`INSERT INTO order_items(order_id, product_id, name, variant, qty, price_cents)
        VALUES(${oid}, ${l.id}, ${l.name}, ${l.variant}, ${l.qty}, ${l.price})`;
    }
    return { id: oid, code };
  });
  await clearCart(cart);
  redirect(`/pay/${order.code}`);
}

/** Load a pending order, enforcing ownership: registered users can only
 *  pay their own orders (guest orders carry no user, so anyone with the
 *  code — i.e. the guest who just checked out — can pay). */
async function ownOrder(code: string) {
  const rows = await db()`SELECT * FROM orders WHERE code = ${code}`;
  const o = rows[0] as Row | undefined;
  if (!o || o.status !== "pending") redirect("/");
  if (o.user_id) {
    const m = await me();
    if (!m || Number(m.id) !== (o.user_id as number)) redirect("/");
  }
  return o;
}

export async function payBalanceAction(code: string) {
  const user = await meRow();
  if (!user) redirect("/login?next=/pay/" + code);
  const o = await ownOrder(code);
  if ((user.balance_cents as number) < (o.total_cents as number)) redirect("/account/balance");
  const sql = db();
  await sql`UPDATE users SET balance_cents = balance_cents - ${o.total_cents} WHERE id = ${user.id}`;
  await sql`INSERT INTO transactions(user_id, kind, label, amount_cents)
    VALUES(${user.id}, 'purchase', ${"Order " + o.code}, ${-(o.total_cents as number)})`;
  await markPaid(o.id as number);
  redirect(`/checkout/success?code=${o.code}`);
}

export async function demoPayAction(code: string) {
  const o = await ownOrder(code);
  await markPaid(o.id as number);
  redirect(`/checkout/success?code=${code}`);
}

export async function startStripeAction(code: string) {
  const o = await ownOrder(code);
  const items = (await db()`SELECT name, qty, price_cents FROM order_items WHERE order_id = ${o.id}`) as Row[];
  const s = await createCheckoutSession({
    code: String(o.code),
    items: items.map((i) => ({ name: String(i.name), qty: Number(i.qty), price: Number(i.price_cents) })),
  });
  await db()`UPDATE orders SET stripe_session = ${s.id} WHERE id = ${o.id}`;
  redirect(s.url!);
}

export async function subscribeAction(planSlug: string) {
  const user = await meRow();
  if (!user) redirect("/login?next=/account/subscriptions");
  const plan = PLANS.find((p) => p.slug === planSlug);
  if (!plan) return;
  const d = new Date();
  d.setDate(d.getDate() + (plan.interval === "month" ? 30 : 365));
  await db()`INSERT INTO subscriptions(user_id, plan, price_cents, interval, status, renews)
    VALUES(${Number(user.id)}, ${plan.name}, ${plan.price}, ${plan.interval}, 'active', ${d.toISOString().slice(0, 10)})`;
  revalidatePath("/account/subscriptions");
}

export async function cancelSubAction(id: number) {
  const user = await meRow();
  if (!user) redirect("/login");
  await db()`UPDATE subscriptions SET status = 'cancelled' WHERE id = ${id} AND user_id = ${Number(user.id)}`;
  revalidatePath("/account/subscriptions");
}

export async function openTicketAction(form: FormData) {
  const user = await meRow();
  if (!user) redirect("/login");
  const subject = String(form.get("subject") || "").slice(0, 200);
  const message = String(form.get("message") || "").slice(0, 4000);
  const orderId = Number(form.get("order_id") || 0) || null;
  if (!subject || !message) return;
  const sql = db();
  const ins = await sql`INSERT INTO tickets(user_id, subject, order_id) VALUES(${Number(user.id)}, ${subject}, ${orderId}) RETURNING id`;
  const tid = (ins[0] as Row).id as number;
  await sql`INSERT INTO messages(ticket_id, user_id, text) VALUES(${tid}, ${Number(user.id)}, ${message})`;
  redirect(`/account/tickets/${tid}`);
}

export async function replyTicketAction(tid: number, form: FormData) {
  const user = await meRow();
  if (!user) redirect("/login");
  const sql = db();
  const t = await sql`SELECT * FROM tickets WHERE id = ${tid} AND user_id = ${Number(user.id)}`;
  if (!t[0] || (t[0] as Row).status === "closed") redirect(`/account/tickets/${tid}`);
  const text = String(form.get("text") || "").slice(0, 4000);
  if (!text) redirect(`/account/tickets/${tid}`);
  await sql`INSERT INTO messages(ticket_id, user_id, text) VALUES(${tid}, ${Number(user.id)}, ${text})`;
  await sql`UPDATE tickets SET status = 'open' WHERE id = ${tid}`;
  redirect(`/account/tickets/${tid}`);
}

export async function closeTicketAction(tid: number) {
  const user = await meRow();
  if (!user) redirect("/login");
  await db()`UPDATE tickets SET status = 'closed' WHERE id = ${tid} AND user_id = ${Number(user.id)}`;
  redirect(`/account/tickets/${tid}`);
}

export async function topupAction(form: FormData) {
  const user = await meRow();
  if (!user) redirect("/login");
  const amt = Math.max(100, Math.min(50000, Math.round(Number(form.get("amount") || 0) * 100)));
  if (!amt) redirect("/account/balance");
  const sql = db();
  const ins = await sql`INSERT INTO orders(user_id, email, kind, subtotal_cents, discount_cents, total_cents)
    VALUES(${Number(user.id)}, ${String(user.email)}, 'topup', ${amt}, 0, ${amt}) RETURNING id`;
  const oid = (ins[0] as Row).id as number;
  const code = "PL-" + (9000 + oid);
  await sql`UPDATE orders SET code = ${code} WHERE id = ${oid}`;
  await sql`INSERT INTO order_items(order_id, name, variant, qty, price_cents) VALUES(${oid}, 'Balance top-up', '', 1, ${amt})`;
  redirect(`/pay/${code}`);
}

export async function payoutAction(form: FormData) {
  const user = await meRow();
  if (!user) redirect("/login");
  const amt = Math.round(Number(form.get("amount") || 0) * 100);
  const details = String(form.get("details") || "").slice(0, 300);
  if (!(amt >= 100) || amt > (user.balance_cents as number)) redirect("/account/affiliate?error=amount");
  await db()`INSERT INTO affiliate_payouts(user_id, amount_cents, details) VALUES(${Number(user.id)}, ${amt}, ${details})`;
  revalidatePath("/account/affiliate");
  redirect("/account/affiliate?ok=payout");
}

export async function resellerApplyAction() {
  const user = await meRow();
  if (!user) redirect("/login");
  await db()`UPDATE users SET reseller_status = 'applied' WHERE id = ${Number(user.id)}`;
  revalidatePath("/account/reseller");
}

export async function resellerBuyAction(productId: number) {
  const user = await meRow();
  if (!user) redirect("/login");
  if (user.reseller_status !== "approved") redirect("/account/reseller?error=approval");
  const sql = db();
  const rows = await sql`SELECT * FROM products WHERE id = ${productId} AND active = TRUE`;
  const p = rows[0] as Row | undefined;
  if (!p || (p.stock as number) < 1) redirect("/account/reseller?error=stock");
  const { RESELLER_PCT } = await import("@/lib/shop");
  const price = Math.floor(((p.price_cents as number) * (100 - RESELLER_PCT)) / 100);
  if ((user.balance_cents as number) < price) redirect("/account/balance?error=funds");
  const order = await sql.begin(async (tx) => {
    const ins = await tx`INSERT INTO orders(user_id, email, kind, subtotal_cents, discount_cents, total_cents)
      VALUES(${Number(user!.id)}, ${String(user!.email)}, 'shop', ${price}, 0, ${price}) RETURNING id`;
    const oid = (ins[0] as Row).id as number;
    const code = "PL-" + (9000 + oid);
    await tx`UPDATE orders SET code = ${code} WHERE id = ${oid}`;
    await tx`INSERT INTO order_items(order_id, product_id, name, variant, qty, price_cents)
      VALUES(${oid}, ${productId}, ${String(p.name)}, 'Reseller', 1, ${price})`;
    await tx`UPDATE users SET balance_cents = balance_cents - ${price} WHERE id = ${Number(user!.id)}`;
    await tx`INSERT INTO transactions(user_id, kind, label, amount_cents)
      VALUES(${Number(user!.id)}, 'purchase', ${"Reseller order " + code}, ${-price})`;
    return { id: oid, code };
  });
  await markPaid(order.id);
  revalidatePath("/account/reseller");
  redirect("/account/reseller?ok=" + order.code);
}

export async function reviewAction(form: FormData) {
  const user = await meRow();
  if (!user) redirect("/login");
  const stars = Math.max(1, Math.min(5, Number(form.get("stars") || 5)));
  await db()`INSERT INTO reviews(product_id, user_id, name, stars, title, text, approved)
    VALUES(${Number(form.get("product_id")) || null}, ${Number(user.id)},
      ${String(user.name || user.email)}, ${stars},
      ${String(form.get("title") || "").slice(0, 200)}, ${String(form.get("text") || "").slice(0, 4000)}, FALSE)`;
  revalidatePath("/reviews");
  redirect("/reviews?ok=moderation");
}

export async function updateProfileAction(form: FormData) {
  const user = await meRow();
  if (!user) redirect("/login");
  await db()`UPDATE users SET name = ${String(form.get("name") || "").slice(0, 80)} WHERE id = ${Number(user.id)}`;
  revalidatePath("/account");
}
