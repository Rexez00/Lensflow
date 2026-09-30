"use client";

import { useMemo, useState } from "react";
import { money } from "@/lib/format";

export type ShipOption = { name: string; description: string; price_cents: number; eta: string };
export type PayOption = { id: string; name: string; tagline: string; kind: string };
export type SavedAddr = {
  id: number; label: string; full_name: string; phone: string; line1: string;
  line2: string; city: string; region: string; postal: string; country: string;
};

export default function CheckoutForm({
  action,
  subtotal,
  discount,
  couponCode,
  ships,
  pays,
  addrs,
  email,
  error,
}: {
  action: (form: FormData) => Promise<void>;
  subtotal: number;
  discount: number;
  couponCode: string;
  ships: ShipOption[];
  pays: PayOption[];
  addrs: SavedAddr[];
  email: string;
  error?: string;
}) {
  const [shipName, setShipName] = useState(ships[0]?.name ?? "Standard");
  const [payId, setPayId] = useState(pays[0]?.id ?? "cod");
  const [addrId, setAddrId] = useState<number>(0);
  const shipCost = useMemo(
    () => ships.find((s) => s.name === shipName)?.price_cents ?? 0,
    [ships, shipName]
  );
  const total = Math.max(0, subtotal - discount + shipCost);
  const chosenAddr = addrs.find((a) => a.id === addrId);

  return (
    <form action={action}>
      {error === "address" && (
        <div className="card" role="alert" style={{ padding: 14, marginBottom: 14, borderColor: "#c00" }}>
          Please complete name, phone, street, city and country.
        </div>
      )}
      {error === "email" && (
        <div className="card" role="alert" style={{ padding: 14, marginBottom: 14, borderColor: "#c00" }}>
          Please enter a valid email address.
        </div>
      )}
      {error === "payment" && (
        <div className="card" role="alert" style={{ padding: 14, marginBottom: 14, borderColor: "#c00" }}>
          Please choose an available payment method.
        </div>
      )}
      {error === "cmi" && (
        <div className="card" role="alert" style={{ padding: 14, marginBottom: 14, borderColor: "#c00" }}>
          CMI is not configured yet — choose Cash on Delivery or card.
        </div>
      )}
      <div className="card" style={{ padding: 22, marginBottom: 14 }}>
        <h3>Contact</h3>
        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="co-email">Email</label>
          <input id="co-email" className="input" name="email" type="email" required defaultValue={email} placeholder="you@example.com" />
        </div>
      </div>

      <div className="card" style={{ padding: 22, marginBottom: 14 }}>
        <h3>Shipping address</h3>
        {addrs.length > 0 && (
          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor="co-addrid">Saved addresses</label>
            <select id="co-addrid" className="input" name="address_id" value={addrId} onChange={(e) => setAddrId(Number(e.target.value))}>
              <option value={0}>— Enter a new address —</option>
              {addrs.map((a) => (
                <option key={a.id} value={a.id}>{a.label} — {a.line1}, {a.city}</option>
              ))}
            </select>
          </div>
        )}
        <div className="bgrid2" style={{ marginTop: 12 }}>
          <div className="field"><label htmlFor="co-name">Full name</label>
            <input id="co-name" className="input" name="full_name" required defaultValue={chosenAddr?.full_name ?? ""} key={"n" + addrId} placeholder="Yasmine El Amrani" /></div>
          <div className="field"><label htmlFor="co-phone">Phone</label>
            <input id="co-phone" className="input" name="phone" required defaultValue={chosenAddr?.phone ?? ""} key={"p" + addrId} placeholder="+212 6 xx xx xx xx" /></div>
          <div className="field" style={{ gridColumn: "1 / -1" }}><label htmlFor="co-l1">Street address</label>
            <input id="co-l1" className="input" name="line1" required defaultValue={chosenAddr?.line1 ?? ""} key={"l" + addrId} placeholder="12 Rue Mohammed V" /></div>
          <div className="field" style={{ gridColumn: "1 / -1" }}><label htmlFor="co-l2">Apartment, floor (optional)</label>
            <input id="co-l2" className="input" name="line2" defaultValue={chosenAddr?.line2 ?? ""} key={"l2" + addrId} /></div>
          <div className="field"><label htmlFor="co-city">City</label>
            <input id="co-city" className="input" name="city" required defaultValue={chosenAddr?.city ?? ""} key={"c" + addrId} placeholder="Casablanca" /></div>
          <div className="field"><label htmlFor="co-region">Region (optional)</label>
            <input id="co-region" className="input" name="region" defaultValue={chosenAddr?.region ?? ""} key={"r" + addrId} placeholder="Casablanca-Settat" /></div>
          <div className="field"><label htmlFor="co-postal">Postal code (optional)</label>
            <input id="co-postal" className="input" name="postal" defaultValue={chosenAddr?.postal ?? ""} key={"z" + addrId} placeholder="20100" /></div>
          <div className="field"><label htmlFor="co-country">Country</label>
            <input id="co-country" className="input" name="country" required defaultValue={chosenAddr?.country ?? "Morocco"} key={"co" + addrId} /></div>
        </div>
      </div>

      <div className="card" style={{ padding: 22, marginBottom: 14 }}>
        <h3>Shipping method</h3>
        <div style={{ display: "grid", gap: 8, marginTop: 12 }} role="radiogroup" aria-label="Shipping method">
          {ships.map((s) => (
            <label key={s.name} className="fl" style={{ border: "1px solid var(--sa-line)", borderRadius: 12, padding: "10px 14px", cursor: "pointer" }}>
              <input type="radio" name="shipping_method" value={s.name} checked={shipName === s.name} onChange={() => setShipName(s.name)} />
              <span style={{ flex: 1 }}><b>{s.name}</b> <small style={{ color: "var(--sa-ink-soft)" }}>· {s.description} · {s.eta}</small></span>
              <b>{s.price_cents === 0 ? "Free" : money(s.price_cents)}</b>
            </label>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 22, marginBottom: 14 }}>
        <h3>Payment</h3>
        <div style={{ display: "grid", gap: 8, marginTop: 12 }} role="radiogroup" aria-label="Payment method">
          {pays.map((p) => (
            <label key={p.id} className="fl" style={{ border: "1px solid var(--sa-line)", borderRadius: 12, padding: "10px 14px", cursor: "pointer" }}>
              <input type="radio" name="payment_method" value={p.id} checked={payId === p.id} onChange={() => setPayId(p.id)} />
              <span style={{ flex: 1 }}><b>{p.name}</b><br /><small style={{ color: "var(--sa-ink-soft)" }}>{p.tagline}</small></span>
            </label>
          ))}
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="co-coupon">Coupon (optional)</label>
          <input id="co-coupon" className="input" name="coupon" defaultValue={couponCode} placeholder="SAVE10" style={{ maxWidth: 220 }} />
        </div>
      </div>

      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
          <span style={{ color: "var(--sa-ink-soft)" }}>Subtotal</span><b>{money(subtotal)}</b>
        </div>
        {discount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#2E9E5B", marginTop: 6 }}>
            <span>Discounts{couponCode ? ` (${couponCode})` : ""}</span><b>−{money(discount)}</b>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginTop: 6 }}>
          <span style={{ color: "var(--sa-ink-soft)" }}>Shipping ({shipName})</span><b>{shipCost === 0 ? "Free" : money(shipCost)}</b>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, margin: "12px 0 16px" }}>
          <span>Total</span><b>{money(total)}</b>
        </div>
        <button className="btn" style={{ width: "100%" }} type="submit">
          {payId === "cod" ? "Place order — pay on delivery →" : "Place order →"}
        </button>
        <p style={{ fontSize: 12, color: "var(--sa-ink-soft)", marginTop: 10 }}>
          {payId === "cod"
            ? "No online payment. Our courier collects cash on delivery."
            : "You will be redirected to complete payment securely."}
        </p>
      </div>
    </form>
  );
}
