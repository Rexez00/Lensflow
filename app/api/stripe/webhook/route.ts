import { NextRequest, NextResponse } from "next/server";
import { stripeClient } from "@/lib/stripe";
import { markPaid } from "@/lib/orders";
import { db , type Row} from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const stripe = stripeClient();
  if (!stripe) return NextResponse.json({ error: "payments disabled" }, { status: 404 });
  const sig = req.headers.get("stripe-signature") || "";
  const secret = process.env.STRIPE_WEBHOOK_SECRET || "";
  // Unsigned events are refused: without signature verification anyone could
  // forge "payment succeeded" calls. Orders still confirm via the success
  // page, which re-verifies the session with the secret key.
  if (!secret) return NextResponse.json({ error: "webhook not configured" }, { status: 400 });
  let event: { type: string; data: { object: Row } };
  try {
    const raw = await req.text();
    event = stripe.webhooks.constructEvent(raw, sig, secret) as unknown as typeof event;
  } catch {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const code = ((event.data.object.metadata ?? {}) as Record<string, string>).order_code;
    if (code) {
      const rows = await db()`SELECT id FROM orders WHERE code = ${code}`;
      if (rows[0]) await markPaid((rows[0] as Row).id as number);
    }
  }
  return NextResponse.json({ ok: true });
}
