import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, type Row } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/order/:code — order status + items, enforcing ownership. */
export async function GET(_req: Request, { params }: { params: { code: string } }) {
  try {
    const rows = (await db()`SELECT * FROM orders WHERE code = ${params.code}`) as Row[];
    const o = rows[0];
    if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (o.user_id) {
      const session = await auth();
      const uid = (session?.user as { id?: string } | undefined)?.id;
      if (!uid || Number(uid) !== (o.user_id as number)) {
        const role = (session?.user as { role?: string } | undefined)?.role;
        if (role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }
    const items = (await db()`SELECT name, variant, qty, price_cents FROM order_items WHERE order_id = ${o.id}`) as Row[];
    return NextResponse.json({
      code: o.code,
      status: o.status,
      total_cents: o.total_cents,
      subtotal_cents: o.subtotal_cents,
      discount_cents: o.discount_cents,
      shipping_cents: o.shipping_cents ?? 0,
      payment_method: o.payment_method ?? "",
      shipping_method: o.shipping_method ?? "",
      shipping_city: o.shipping_city ?? "",
      shipping_country: o.shipping_country ?? "",
      created: o.created,
      items,
    });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
