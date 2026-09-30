import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, type Row } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/orders — signed-in user's orders (for account pages). */
export async function GET() {
  const session = await auth();
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!uid) return NextResponse.json([], { status: 401 });
  try {
    const rows = (await db()`SELECT code, total_cents, status, created, payment_method, shipping_method
      FROM orders WHERE user_id = ${Number(uid)} ORDER BY id DESC LIMIT 100`) as Row[];
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([], { status: 503 });
  }
}
