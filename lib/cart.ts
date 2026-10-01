import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { db , type Row} from "./db";

export type CartItem = { id: number; qty: number; variant: string };
export type Cart = {
  id: number;
  token: string;
  user_id: number | null;
  items: CartItem[];
  coupon: string;
};

export const CART_COOKIE = "lf_cart";

function asItems(v: unknown): CartItem[] {
  if (Array.isArray(v)) return v as CartItem[];
  if (typeof v === "string") {
    try {
      const p: unknown = JSON.parse(v);
      if (Array.isArray(p)) return p as CartItem[];
    } catch { /* fall through */ }
  }
  return [];
}

function rowToCart(r: Row): Cart {
  return {
    id: r.id as number,
    token: r.token as string,
    user_id: (r.user_id as number | null) ?? null,
    items: asItems(r.items),
    coupon: (r.coupon as string) ?? "",
  };
}

function setCartCookie(token: string) {
  cookies().set(CART_COOKIE, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
}

export { setCartCookie };

/** Read-only: safe in Server Components. Returns null when no cart yet. */
export async function readCart(): Promise<Cart | null> {
  const token = cookies().get(CART_COOKIE)?.value;
  if (token) {
    const rows = await db()`SELECT * FROM carts WHERE token = ${token}`;
    if (rows[0]) return rowToCart(rows[0] as Row);
  }
  // Logged-in users without (or with a stale) cart cookie: fall back to the
  // latest user-bound cart so Server Components agree with /api/cart, which
  // resolves logged-in carts by user id. (E.g. cookies cleared mid-session.)
  try {
    const { auth } = await import("@/auth");
    const session = await auth();
    const uid = (session?.user as { id?: string } | undefined)?.id;
    if (uid) {
      const rows = await db()`SELECT * FROM carts WHERE user_id = ${Number(uid)} ORDER BY updated DESC LIMIT 1`;
      if (rows[0]) return rowToCart(rows[0] as Row);
    }
  } catch {
    /* anonymous or DB down — no cart */
  }
  return null;
}

/** Read-write: use ONLY in Route Handlers and Server Actions. */
export async function getOrCreateCart(): Promise<Cart> {
  const existing = await readCart();
  if (existing) return existing;
  const token = randomUUID();
  const rows = await db()`INSERT INTO carts(token) VALUES(${token}) RETURNING *`;
  setCartCookie(token);
  return rowToCart(rows[0] as Row);
}

export async function saveCart(cart: Cart) {
  // Structural invariant: items is always stored as a JSON array, never a
  // doubly-encoded string, no matter what a caller passes in.
  const items = asItems(cart.items);
  cart.items = items;
  const sql = db();
  await sql`UPDATE carts SET items = ${sql.json(items)},
    coupon = ${cart.coupon}, user_id = ${cart.user_id}, updated = now()
    WHERE id = ${cart.id}`;
}

export async function clearCart(cart: Cart) {
  await db()`UPDATE carts SET items = '[]'::jsonb, coupon = '', updated = now() WHERE id = ${cart.id}`;
}

/** After login/register: attach the anonymous cart to the user, merging. */
export async function attachCartToUser(userId: number) {
  const token = cookies().get(CART_COOKIE)?.value;
  if (!token) return;
  const sql = db();
  const mine = await sql`SELECT * FROM carts WHERE token = ${token}`;
  if (!mine[0]) return;
  const mineItems = asItems((mine[0] as Row).items);
  const others = await sql`SELECT * FROM carts WHERE user_id = ${userId} AND token <> ${token} ORDER BY updated DESC LIMIT 1`;
  if (others[0]) {
    const o = rowToCart(others[0] as Row);
    const merged = [...o.items];
    for (const it of mineItems) {
      const f = merged.find((m) => m.id === it.id && m.variant === it.variant);
      if (f) f.qty = Math.min(99, f.qty + it.qty);
      else merged.push(it);
    }
    await sql`UPDATE carts SET items = ${sql.json(merged)}, updated = now() WHERE id = ${o.id}`;
    await sql`DELETE FROM carts WHERE id = ${(mine[0] as Row).id}`;
    setCartCookie(o.token);
  } else {
    await sql`UPDATE carts SET user_id = ${userId} WHERE token = ${token}`;
  }
}

export type EnrichedLine = {
  id: number;
  name: string;
  slug: string;
  variant: string;
  qty: number;
  price: number;
  line: number;
  image_url: string;
  max_stock: number;
};

/** Resolve cart items against authoritative DB rows (display + totals).
 *  Variant pricing is backend-driven: product_variants.price_cents overrides
 *  the base product price when set, otherwise the base price applies. */
export async function enrichCart(cart: Cart | null): Promise<{ lines: EnrichedLine[]; total: number }> {
  if (!cart || cart.items.length === 0) return { lines: [], total: 0 };
  const ids = [...new Set(cart.items.map((i) => i.id))];
  const rows = await db()`SELECT * FROM products WHERE id = ANY(${ids}) AND active = TRUE`;
  const byId = new Map<number, Row>();
  for (const r of rows) byId.set(r.id as number, r as Row);
  let variants: Row[] = [];
  try {
    variants = (await db()`SELECT * FROM product_variants WHERE product_id = ANY(${ids}) AND active = TRUE`) as Row[];
  } catch {
    variants = [];
  }
  const vmap = new Map<string, Row>();
  for (const v of variants) vmap.set(`${v.product_id as number}::${String(v.name)}`, v);
  const lines: EnrichedLine[] = [];
  let total = 0;
  for (const it of cart.items) {
    const p = byId.get(it.id);
    if (!p) continue;
    const qty = Math.max(1, Math.min(99, it.qty));
    const v = vmap.get(`${it.id}::${it.variant || "Standard"}`);
    const price = v?.price_cents != null ? (v.price_cents as number) : (p.price_cents as number);
    const baseStock = p.stock as number;
    const vStock = v?.stock != null ? (v.stock as number) : baseStock;
    lines.push({
      id: it.id, name: p.name as string, slug: p.slug as string,
      variant: it.variant || "Standard", qty, price, line: price * qty,
      image_url: (p.image_url as string) ?? "",
      max_stock: Math.max(0, vStock ?? baseStock ?? 0),
    });
    total += price * qty;
  }
  return { lines, total };
}
