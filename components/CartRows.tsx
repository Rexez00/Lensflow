"use client";

import { useRouter } from "next/navigation";
import { money } from "@/lib/format";
import { LensThumb } from "./ProductCard";
import type { EnrichedLine } from "@/lib/cart";

export default function CartRows({ initial }: { initial: EnrichedLine[] }) {
  const router = useRouter();
  const post = async (body: Record<string, unknown>) => {
    await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    router.refresh();
  };
  if (!initial.length) {
    return <div className="empty card" style={{ padding: "60px 20px" }}>Your cart is empty.<br /><br /><a className="btn" href="/products">Browse lenses</a></div>;
  }
  return (
    <>
      {initial.map((it) => (
        <div className="card" style={{ padding: 14, display: "flex", gap: 14, alignItems: "center", marginBottom: 12 }} key={it.id}>
          <div className="thumb" style={{ width: 84, minHeight: 84, flexShrink: 0 }}><LensThumb /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>{it.name}</b><br /><small style={{ color: "var(--sa-ink-soft)" }}>{it.variant}</small>
            <div style={{ marginTop: 8 }} className="stepper">
              <button onClick={() => post({ op: "update", id: it.id, qty: it.qty - 1 })}>−</button>
              <b>{it.qty}</b>
              <button onClick={() => post({ op: "update", id: it.id, qty: it.qty + 1 })}>+</button>
            </div>
          </div>
          <div style={{ textAlign: "right" }}><b>{money(it.line)}</b><br />
            <button onClick={() => post({ op: "remove", id: it.id })} style={{ background: "none", border: 0, color: "var(--sa-ink-soft)", cursor: "pointer", fontSize: 13, marginTop: 6 }}>Remove</button>
          </div>
        </div>
      ))}
    </>
  );
}
