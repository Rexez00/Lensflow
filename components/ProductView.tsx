"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { money } from "@/lib/format";
import { LensThumb } from "./ProductCard";

export type VP = {
  id: number; name: string; price_cents: number; old_cents: number | null;
  stock: number; rating: number; rating_count: number; description: string;
};

export default function ProductView({ p, revCount }: { p: VP; revCount: number }) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState("Standard");
  const [tab, setTab] = useState<"d" | "r" | "s">("d");
  const [thumb, setThumb] = useState(0);

  const post = async (op: string, extra: Record<string, unknown> = {}) => {
    const r = await fetch("/api/cart", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op, id: p.id, qty, variant, ...extra }),
    });
    return r.json();
  };

  return (
    <>
      <div className="pd">
        <div>
          <div className="gal-main"><LensThumb /></div>
          <div className="gal-th">
            {[0, 1, 2].map((i) => (
              <div key={i} className={thumb === i ? "on" : ""} onClick={() => setThumb(i)}><LensThumb /></div>
            ))}
          </div>
        </div>
        <div className="buybox card">
          <h1>{p.name}</h1>
          <div style={{ fontSize: 13, color: "var(--sa-ink-soft)", marginTop: 4 }}>
            <span className="stars">★★★★★</span> {p.rating} · {p.rating_count} reviews
          </div>
          <div className="price">
            {money(p.price_cents)}{" "}
            {p.old_cents ? <small style={{ textDecoration: "line-through", color: "var(--sa-ink-soft)", fontSize: 15 }}>{money(p.old_cents)}</small> : null}
          </div>
          {p.stock ? <div className="stock">{p.stock} in stock</div> : <div className="oos">Out of stock</div>}
          <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--sa-ink-soft)", margin: "14px 0 8px" }}>Bundle</h4>
          <div className="pills">
            {["Standard", "With spare clip", "Gift wrapped"].map((v) => (
              <button key={v} className={"pill" + (variant === v ? " on" : "")} onClick={() => setVariant(v)}>{v}</button>
            ))}
          </div>
          <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--sa-ink-soft)", margin: "14px 0 8px" }}>Quantity</h4>
          <div className="stepper">
            <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button><b>{qty}</b>
            <button onClick={() => setQty(Math.min(99, qty + 1))}>+</button>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
            <button className="btn" style={{ flex: 1 }} disabled={!p.stock}
              onClick={async () => { await post("add"); router.refresh(); location.href = "/cart"; }}>Add to cart</button>
            <button className="btn ghost" style={{ flex: 1 }} disabled={!p.stock}
              onClick={async () => { await post("add"); location.href = "/cart"; }}>Buy now</button>
          </div>
          <p style={{ fontSize: 12, color: "var(--sa-ink-soft)", marginTop: 12 }}>✓ Free tracked shipping &nbsp; ✓ One-year guarantee</p>
        </div>
      </div>
      <div className="tabs">
        <button className={tab === "d" ? "on" : ""} onClick={() => setTab("d")}>Description</button>
        <button className={tab === "r" ? "on" : ""} onClick={() => setTab("r")}>Reviews ({revCount})</button>
        <button className={tab === "s" ? "on" : ""} onClick={() => setTab("s")}>Shipping</button>
      </div>
      <div className="tabbody">
        {tab === "d" && <>{p.description} Every lens ships with a universal clip, microfiber cloth and quick-start card.</>}
        {tab === "r" && <>Rated {p.rating} across {p.rating_count} verified reviews. <a href="/reviews" style={{ color: "var(--sa-accent)" }}>Read all reviews</a></>}
        {tab === "s" && <>Tracked shipping on every order. One-year quality guarantee included.</>}
      </div>
    </>
  );
}
