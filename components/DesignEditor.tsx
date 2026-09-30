"use client";

import { useState } from "react";
import { saveDesign } from "@/actions/admin";
import type { SiteTheme } from "@/lib/theme";

const ACCENTS = ["#7C2DFF", "#0EA5E9", "#16A34A", "#F59E0B", "#EF4444", "#EC4899", "#111827"];
const EMOJIS = ["📷", "🔭", "📸", "✨", "🌙", "🔥", "💜"];

export default function DesignEditor({ initial }: { initial: SiteTheme }) {
  const [f, setF] = useState<SiteTheme>(initial);
  const set = (k: keyof SiteTheme, v: string) => setF((s) => ({ ...s, [k]: v }));

  const heroLines = f.hero_title.split("\n");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 18, alignItems: "start" }} className="design-wrap">
      <form action={saveDesign} className="card" style={{ padding: 20, position: "sticky", top: 88 }}>
        <h3>🎨 Canva-style editor</h3>
        <p style={{ fontSize: 13, color: "var(--sa-ink-soft)", margin: "4px 0 12px" }}>Type, pick colors & images — watch the live preview on the right. Hit Publish to go live.</p>

        <h4 className="dsec">Branding</h4>
        <div className="field"><label>Store name</label><input className="input" name="store_name" value={f.store_name} onChange={(e) => set("store_name", e.target.value)} /></div>
        <div className="field"><label>Logo image URL (empty = text logo)</label><input className="input" name="logo_url" value={f.logo_url} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://…" /></div>
        <div className="field"><label>Accent color</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {ACCENTS.map((c) => (
              <button key={c} type="button" onClick={() => set("accent_color", c)} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: f.accent_color === c ? "3px solid #000" : "1px solid var(--sa-line)", cursor: "pointer" }} title={c} />
            ))}
            <input type="color" name="accent_color" value={/^#[0-9a-fA-F]{6}$/.test(f.accent_color) ? f.accent_color : "#7C2DFF"} onChange={(e) => set("accent_color", e.target.value)} style={{ width: 36, height: 28 }} />
          </div>
        </div>

        <h4 className="dsec">Announcement bar</h4>
        <div className="field"><input className="input" name="announcement" value={f.announcement} onChange={(e) => set("announcement", e.target.value)} placeholder="Free shipping…" /></div>

        <h4 className="dsec">Hero</h4>
        <div className="field"><label>Title (line break = new line)</label><textarea className="input" name="hero_title" rows={2} value={f.hero_title} onChange={(e) => set("hero_title", e.target.value)} /></div>
        <div className="field"><label>Subtitle</label><textarea className="input" name="hero_subtitle" rows={3} value={f.hero_subtitle} onChange={(e) => set("hero_subtitle", e.target.value)} /></div>
        <div className="field"><label>Button text</label><input className="input" name="hero_cta_text" value={f.hero_cta_text} onChange={(e) => set("hero_cta_text", e.target.value)} /></div>
        <div className="field"><label>Hero image URL (right side)</label><input className="input" name="hero_image_url" value={f.hero_image_url} onChange={(e) => set("hero_image_url", e.target.value)} placeholder="https://…" /></div>
        <div className="field"><label>Fallback emoji if no image</label>
          <div style={{ display: "flex", gap: 6 }}>
            {EMOJIS.map((em) => (
              <button key={em} type="button" onClick={() => set("hero_image_emoji", em)} style={{ fontSize: 20, border: f.hero_image_emoji === em ? "2px solid var(--sa-accent)" : "1px solid var(--sa-line)", borderRadius: 10, padding: "4px 8px", cursor: "pointer", background: "var(--sa-card)" }}>{em}</button>
            ))}
          </div>
          <input type="hidden" name="hero_image_emoji" value={f.hero_image_emoji} />
        </div>

        <h4 className="dsec">Trust badges</h4>
        <div className="field"><input className="input" name="trust_1" value={f.trust_1} onChange={(e) => set("trust_1", e.target.value)} /></div>
        <div className="field"><input className="input" name="trust_2" value={f.trust_2} onChange={(e) => set("trust_2", e.target.value)} /></div>
        <div className="field"><input className="input" name="trust_3" value={f.trust_3} onChange={(e) => set("trust_3", e.target.value)} /></div>

        <h4 className="dsec">Homepage & footer</h4>
        <div className="field"><label>Featured section title</label><input className="input" name="featured_title" value={f.featured_title} onChange={(e) => set("featured_title", e.target.value)} /></div>
        <div className="field"><label>Footer tagline</label><input className="input" name="footer_tagline" value={f.footer_tagline} onChange={(e) => set("footer_tagline", e.target.value)} /></div>

        <button className="btn" style={{ width: "100%", marginTop: 8 }}>Publish changes 🚀</button>
        <a href="/" target="_blank" className="btn ghost" style={{ width: "100%", marginTop: 8 }}>View storefront</a>
      </form>

      <div>
        <p style={{ fontSize: 13, color: "var(--sa-ink-soft)", marginBottom: 8 }}>Live preview — exactly how shoppers see it:</p>
        <div className="card" style={{ padding: "10px 18px", marginBottom: 14, fontSize: 13, textAlign: "center" }}>📣 {f.announcement || "—"}</div>
        <section className="hero" style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr", gap: 16, alignItems: "center" }}>
          <div>
            <h1 style={{ whiteSpace: "pre-line" }}>{heroLines[0]}<br />{heroLines.slice(1).join("\n")}</h1>
            <p>{f.hero_subtitle}</p>
            <span className="cta" style={{ background: f.accent_color, color: "#fff" }}>{f.hero_cta_text}</span>
            <div className="trust">
              <span><b>✓</b>{f.trust_1}</span><span><b>✓</b>{f.trust_2}</span><span><b>✓</b>{f.trust_3}</span>
            </div>
          </div>
          <div className="sideimg" style={{ minHeight: 180, overflow: "hidden" }}>
            {f.hero_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.hero_image_url} alt="hero" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : <span style={{ fontSize: 64 }}>{f.hero_image_emoji}</span>}
          </div>
        </section>
        <div className="card" style={{ padding: 18, marginTop: 14, borderTop: `4px solid ${f.accent_color}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {f.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.logo_url} alt="logo" style={{ height: 32 }} />
            ) : <b>{f.store_name}</b>}
            <span style={{ fontSize: 12, color: "var(--sa-ink-soft)" }}>{f.footer_tagline}</span>
          </div>
          <div style={{ marginTop: 10, fontSize: 13 }}>Section title: <b>{f.featured_title}</b></div>
        </div>
      </div>
    </div>
  );
}
