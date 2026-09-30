"use client";

import { money } from "@/lib/format";

export function LensThumb() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 1v3M12 20v3M1 12h3M20 12h3" />
    </svg>
  );
}

export function PImg({ src, alt, tall }: { src: string; alt: string; tall?: boolean }) {
  if (!src) return <LensThumb />;
  return <img src={src} alt={alt} className={tall ? "pimg tall" : "pimg"} loading="lazy" />;
}

export type CardProduct = {
  id: number;
  name: string;
  slug: string;
  sub: string;
  price_cents: number;
  stock: number;
  image_url?: string;
  badge?: string;
};

export default function ProductCard({ p }: { p: CardProduct }) {
  const add = async () => {
    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "add", id: p.id, qty: 1 }),
    });
    location.reload();
  };
  return (
    <div className="card pcard">
      <a href={"/product/" + p.slug}>
        <div className="thumb pthumb">
          {p.badge ? <span className="pbadge">{p.badge}</span> : null}
          <PImg src={p.image_url ?? ""} alt={p.name} />
        </div>
        <h3>{p.name}</h3>
        <small>{p.sub}</small>
      </a>
      {p.stock ? <div className="stock">{p.stock} in stock</div> : <div className="oos">Out of stock</div>}
      <div className="buyrow">
        <b>{money(p.price_cents)}</b>
        <button className="addbtn" onClick={add} disabled={!p.stock}>Add to Cart</button>
      </div>
    </div>
  );
}
