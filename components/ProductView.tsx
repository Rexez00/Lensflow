"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { money } from "@/lib/format";
import { LensThumb } from "./ProductCard";

export type VP = {
  id: number; name: string; price_cents: number; old_cents: number | null;
  stock: number; rating: number; rating_count: number; description: string;
  image_url?: string;
};

export type VV = {
  id: number; name: string; sku: string;
  effective_price: number; effective_stock: number;
};

export default function ProductView({
  p, revCount, variants, images,
}: {
  p: VP; revCount: number; variants: VV[]; images: string[];
}) {
  const router = useRouter();
  const opts = variants.length ? variants : [{ id: 0, name: "Standard", sku: "", effective_price: p.price_cents, effective_stock: p.stock }];
  const [variant, setVariant] = useState(opts[0].name);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"d" | "r" | "s">("d");
  const [thumb, setThumb] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const current = useMemo(
    () => opts.find((v) => v.name === variant) ?? opts[0],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [variant]
  );
  const gallery = images.length ? images : p.image_url ? [p.image_url] : [];
  const main = gallery[Math.min(thumb, gallery.length - 1)] ?? "";

  const post = async (op: string, extra: Record<string, unknown> = {}) => {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/cart", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op, id: p.id, qty, variant, ...extra }),
      });
      const j = await r.json();
      if (!r.ok || j.ok === false) {
        setErr(j.error === "unknown variant" ? "That option is no longer available." : "Could not update the cart.");
        return null;
      }
      return j;
    } catch {
      setErr("Network error — please try again.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const out = current.effective_stock <= 0;

  return (
    <>
      <div className="pd">
        <div>
          <div className="gal-main" style={{ overflow: "hidden", padding: 0 }}>
            {main ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={main} alt={p.name} className="pimg-large" />
            ) : (
              <LensThumb />
            )}
          </div>
          {gallery.length > 1 && (
            <div className="gal-th">
              {gallery.map((src, i) => (
                <div key={src + i} className={thumb === i ? "on" : ""} onClick={() => setThumb(i)}
                  role="button" tabIndex={0} aria-label={`View image ${i + 1}`}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setThumb(i); }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="buybox card">
          <h1>{p.name}</h1>
          <div style={{ fontSize: 13, color: "var(--sa-ink-soft)", marginTop: 4 }}>
            <span className="stars">★★★★★</span> {p.rating} · {p.rating_count} reviews
          </div>
          <div className="price">
            {money(current.effective_price)}{" "}
            {p.old_cents && p.old_cents > current.effective_price ? (
              <small style={{ textDecoration: "line-through", color: "var(--sa-ink-soft)", fontSize: 15 }}>{money(p.old_cents)}</small>
            ) : null}
          </div>
          {out
            ? <div className="oos">Out of stock{opts.length > 1 ? " for this option" : ""}</div>
            : <div className="stock">{current.effective_stock} in stock</div>}
          {opts.length > 1 && (
            <>
              <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--sa-ink-soft)", margin: "14px 0 8px" }}>Option</h4>
              <div className="pills" role="radiogroup" aria-label="Variant">
                {opts.map((v) => (
                  <button key={v.name} type="button"
                    className={"pill" + (variant === v.name ? " on" : "")}
                    aria-pressed={variant === v.name}
                    onClick={() => { setVariant(v.name); setQty(1); }}>{v.name}</button>
                ))}
              </div>
            </>
          )}
          <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--sa-ink-soft)", margin: "14px 0 8px" }}>Quantity</h4>
          <div className="stepper">
            <button type="button" aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
            <b aria-live="polite">{qty}</b>
            <button type="button" aria-label="Increase quantity" onClick={() => setQty(Math.min(Math.max(1, current.effective_stock), 99, qty + 1))}>+</button>
          </div>
          {err && <p role="alert" style={{ color: "#b00", fontSize: 13, marginTop: 10 }}>{err}</p>}
          <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
            <button className="btn" style={{ flex: 1 }} disabled={out || busy}
              onClick={async () => { const j = await post("add"); if (j) { router.refresh(); location.href = "/cart"; } }}>
              {busy ? "Adding…" : "Add to cart"}</button>
            <button className="btn ghost" style={{ flex: 1 }} disabled={out || busy}
              onClick={async () => { const j = await post("add"); if (j) location.href = "/cart"; }}>Buy now</button>
          </div>
          <p style={{ fontSize: 12, color: "var(--sa-ink-soft)", marginTop: 12 }}>✓ Free tracked shipping &nbsp; ✓ One-year guarantee &nbsp; ✓ Cash on Delivery available</p>
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
        {tab === "s" && <>Tracked shipping on every order. Standard is free, Express arrives in 1–2 days. Cash on Delivery available across Morocco.</>}
      </div>
    </>
  );
}
