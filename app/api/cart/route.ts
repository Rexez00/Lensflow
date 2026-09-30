import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { attachCartToUser, enrichCart, getOrCreateCart, readCart, saveCart } from "@/lib/cart";
import { db , type Row} from "@/lib/db";

export const dynamic = "force-dynamic";

async function resolveCart() {
  const session = await auth();
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (uid) {
    await attachCartToUser(Number(uid));
    const rows = await db()`SELECT * FROM carts WHERE user_id = ${Number(uid)} ORDER BY updated DESC LIMIT 1`;
    if (rows[0]) {
      const r = rows[0] as Row;
      return {
        id: r.id as number, token: r.token as string, user_id: r.user_id as number,
        items: (r.items as { id: number; qty: number; variant: string }[]) ?? [], coupon: (r.coupon as string) ?? "",
      };
    }
  }
  return getOrCreateCart();
}

export async function GET() {
  try {
    const cart = await resolveCart();
    const { lines, total } = await enrichCart(cart);
    return NextResponse.json({ items: lines, total, count: lines.reduce((n, l) => n + l.qty, 0), coupon: cart.coupon });
  } catch (e) {
    console.error("CART_GET_FAIL", e);
    return NextResponse.json({ items: [], total: 0, count: 0, coupon: "", error: "unavailable" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cart = await resolveCart();
    const op = String(body.op || "");
    if (op === "add") {
      const id = Number(body.id);
      const qty = Math.max(1, Math.min(99, Number(body.qty || 1)));
      const variant = String(body.variant || "Standard").slice(0, 60);
      const rows = await db()`SELECT id, stock, active FROM products WHERE id = ${id}`;
      const p = rows[0] as Row | undefined;
      if (!p || !p.active) return NextResponse.json({ ok: false }, { status: 404 });
      const f = cart.items.find((i) => i.id === id && i.variant === variant);
      if (f) f.qty = Math.min(99, f.qty + qty);
      else cart.items.push({ id, qty, variant });
    } else if (op === "update") {
      const id = Number(body.id);
      const qty = Number(body.qty || 0);
      if (qty < 1) cart.items = cart.items.filter((i) => i.id !== id);
      else {
        const f = cart.items.find((i) => i.id === id);
        if (f) f.qty = Math.min(99, qty);
      }
    } else if (op === "remove") {
      const id = Number(body.id);
      cart.items = cart.items.filter((i) => i.id !== id);
    } else if (op === "coupon") {
      cart.coupon = String(body.code || "").trim().toUpperCase().slice(0, 32);
    } else {
      return NextResponse.json({ ok: false, error: "bad op" }, { status: 400 });
    }
    await saveCart(cart);
    const { lines, total } = await enrichCart(cart);
    return NextResponse.json({ ok: true, items: lines, total, count: lines.reduce((n, l) => n + l.qty, 0), coupon: cart.coupon });
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }
}
