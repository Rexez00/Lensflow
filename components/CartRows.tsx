"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { money } from "@/lib/format";
import type { EnrichedLine } from "@/lib/cart";

export default function CartRows({ initial }: { initial: EnrichedLine[] }) {
  const router = useRouter();
  const [err, setErr] = useState("");
  const post = async (body: Record<string, unknown>) => {
    setErr("");
    try {
      const r = await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok || j.ok === false) setErr("Could not update the cart — please try again.");
    } catch {
      setErr("Network error — please try again.");
    }
    router.refresh();
  };
  if (!initial.length) {
    return <div className="empty card" style={{ padding: "60px 20px" }}>Your cart is empty.<br /><br /><a className="btn" href="/products">Browse lenses</a></div>;
  }
  return (
    <>
      {err && <div className="card" role="alert" style={{ padding: 12, marginBottom: 12 }}>{err}</div>}
      {initial.map((it) => (
        <div className="card" style={{ padding: 14, display: "flex", gap: 14, alignItems: "center", marginBottom: 12 }} key={it.id + it.variant}>
          <a className="thumb" style={{ width: 84, minHeight: 84, flexShrink: 0, overflow: "hidden", display: "block" }} href={"/product/" + it.slug} aria-label={it.name}>
            {it.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /></svg>
            )}
          </a>
          <div style={{ flex: 1, minWidth: 0 }}>
            <a href={"/product/" + it.slug}><b>{it.name}</b></a><br />
            <small style={{ color: "var(--sa-ink-soft)" }}>{it.variant} · {money(it.price)} each</small>
            {it.max_stock <= it.qty && it.max_stock > 0 && (
              <div style={{ fontSize: 12, color: "#a60", marginTop: 4 }}>Only {it.max_stock} available</div>
            )}
            <div style={{ marginTop: 8 }} className="stepper">
              <button aria-label="Decrease quantity" onClick={() => post({ op: "update", id: it.id, qty: it.qty - 1 })}>−</button>
              <b aria-live="polite">{it.qty}</b>
              <button aria-label="Increase quantity" disabled={it.qty >= Math.min(99, it.max_stock || 99)} onClick={() => post({ op: "update", id: it.id, qty: it.qty + 1 })}>+</button>
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
