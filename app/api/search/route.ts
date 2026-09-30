import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  try {
    const rows = await db()`SELECT slug, name, sub, price_cents FROM products
      WHERE active = TRUE AND (name ILIKE ${"%" + q + "%"} OR sub ILIKE ${"%" + q + "%"}) LIMIT 6`;
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([], { status: 503 });
  }
}
