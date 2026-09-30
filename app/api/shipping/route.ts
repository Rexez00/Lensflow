import { NextResponse } from "next/server";
import { listShippingMethods } from "@/lib/shipping";

export const dynamic = "force-dynamic";

/** GET /api/shipping — active shipping methods for checkout. */
export async function GET() {
  const methods = await listShippingMethods();
  return NextResponse.json(methods);
}
