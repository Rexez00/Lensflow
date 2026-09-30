"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export const money = (c: number) => "$" + (c / 100).toFixed(2);
const LENS = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3.5" />
  </svg>
);

type User = { name: string | null; email: string; role: string } | null;
type Line = { id: number; name: string; slug: string; variant: string; qty: number; price: number; line: number };

const NAV = [
  { href: "/", label: "Discover", nav: "home" },
  { href: "/products", label: "Products", nav: "products" },
  { href: "/reviews", label: "Reviews", nav: "reviews" },
  { href: "/faq", label: "FAQ", nav: "faq" },
];

export default function Chrome({
  user, storeName, announcement, cartCount: initialCount, children,
}: {
  user: User;
  storeName: string;
  announcement: string;
  cartCount: number;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const [count, setCount] = useState(initialCount);
  const [lines, setLines] = useState<Line[]>([]);
  const [total, setTotal] = useState(0);
  const [drawer, setDrawer] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [hits, setHits] = useState<Line[]>([]);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const [cookieOpen, setCookieOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const toastId = useRef(0);

  useEffect(() => {
    try {
      const s = localStorage.getItem("lf-scheme");
      if (s === "light" || s === "dark") document.documentElement.setAttribute("data-scheme", s);
      else if (matchMedia("(prefers-color-scheme: dark)").matches)
        document.documentElement.setAttribute("data-scheme", "dark");
    } catch {}
    try {
      if (!localStorage.getItem("lf-consent")) {
        const t = setTimeout(() => setCookieOpen(true), 1200);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  const toast = useCallback((msg: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const refreshCart = useCallback(async () => {
    try {
      const r = await fetch("/api/cart", { cache: "no-store" });
      const j = await r.json();
      setLines(j.items ?? []);
      setTotal(j.total ?? 0);
      setCount((j.items ?? []).reduce((n: number, i: Line) => n + i.qty, 0));
    } catch {}
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart, path]);

  useEffect(() => {
    if (!searchOpen) return;
    let live = true;
    fetch("/api/search?q=" + encodeURIComponent(term))
      .then((r) => r.json())
      .then((j) => live && setHits(j))
      .catch(() => {});
    return () => { live = false; };
  }, [term, searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setDrawer(false); setSearchOpen(false); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const toggleScheme = () => {
    const cur = document.documentElement.getAttribute("data-scheme");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-scheme", next);
    try { localStorage.setItem("lf-scheme", next); } catch {}
  };

  const setConsent = (v: string) => {
    try { localStorage.setItem("lf-consent", v); } catch {}
    setCookieOpen(false);
    toast("Preferences saved");
  };

  const rmItem = async (id: number) => {
    await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "remove", id }) });
    refreshCart();
    window.dispatchEvent(new CustomEvent("lf:cart"));
  };

  const active = (nav: string) =>
    nav === "home" ? path === "/" : path.startsWith("/" + (nav === "products" ? "product" : nav)) || path.startsWith("/" + nav);

  return (
    <div className="app">
      <aside className="rail">
        <a className="brand" href="/">LENSFL<em>O</em>W</a>
        {NAV.map((n) => (
          <a key={n.href} className={"rlink" + (active(n.nav) ? " active" : "")} href={n.href}>{n.label}</a>
        ))}
        <div className="rfoot">
          <div className="rrow">
            <button className="iconbtn" onClick={toggleScheme} aria-label="Toggle theme">◐</button>
          </div>
          {user ? (
            <a className="acct" href="/account"><span className="ava">{(user.name || user.email)[0].toUpperCase()}</span>{user.name || "My account"}</a>
          ) : (
            <a className="acct" href="/login"><span className="ava">?</span>Sign in</a>
          )}
        </div>
      </aside>
      <div className="main">
        <div className="topbar">
          <button className="iconbtn m-only" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">☰</button>
          <a className="brand m-only" href="/" style={{ fontSize: 17, padding: 0 }}>LENSFL<em>O</em>W</a>
          <button className="search-pill" onClick={() => setSearchOpen(true)}><span style={{ flex: 1, textAlign: "left" }}>Search products…</span></button>
          <div className="acts">
            <button className="iconbtn" onClick={toggleScheme} aria-label="Toggle theme">◐</button>
            <button className="iconbtn" onClick={() => { setDrawer(true); refreshCart(); }} aria-label="Cart">🛒
              <span className="badge" data-cart-count style={{ display: count ? "" : "none" }}>{count > 9 ? "9+" : count}</span>
            </button>
            {user ? <a className="signupbtn asignin" href="/account">Account</a>
              : <a className="signupbtn asignin" href="/login">Sign in</a>}
          </div>
          {menuOpen && (
            <div id="mmenu" className="open">
              {NAV.map((n) => <a key={n.href} href={n.href}>{n.label}</a>)}
              <a href="/account">My account</a>
            </div>
          )}
        </div>
        <div className="content">
          {announcement ? <div className="card" style={{ padding: "10px 18px", marginBottom: 14, fontSize: 13, textAlign: "center" }}>📣 {announcement}</div> : null}
          {children}
          <footer className="appfoot">
            <div className="cols">
              <div><span className="brand" style={{ padding: "0 0 10px", display: "block" }}>{storeName}</span>
                <p style={{ fontSize: 13, color: "var(--sa-ink-soft)" }}>Pocket-size fisheye and macro lenses for your phone.</p></div>
              <div><h4>Shop</h4><a href="/">Home</a><a href="/products">Products</a><a href="/reviews">Reviews</a><a href="/status">Status</a></div>
              <div><h4>Account</h4><a href="/account">Dashboard</a><a href="/account/orders">Orders</a><a href="/account/tickets">Tickets</a></div>
              <div><h4>Legal</h4><a href="/legal">Terms</a><a href="/blog">Blog</a>{user?.role === "admin" ? <a href="/admin">Admin</a> : null}</div>
            </div>
            <div className="base"><span>© 2026 {storeName}. All rights reserved.</span><span>Secure checkout</span></div>
          </footer>
        </div>
      </div>
      <nav className="mbar">
        <a className={path === "/" ? "on" : ""} href="/">⌂<span>Home</span></a>
        <a className={path.startsWith("/product") ? "on" : ""} href="/products">◎<span>Shop</span></a>
        <a href="#" onClick={(e) => { e.preventDefault(); setSearchOpen(true); }}>⌕<span>Search</span></a>
        <a href="#" onClick={(e) => { e.preventDefault(); setDrawer(true); refreshCart(); }}>🛒<span>Cart</span></a>
      </nav>
      <div className={"overlay" + (drawer ? " open" : "")} onClick={() => setDrawer(false)} />
      <aside className={"drawer" + (drawer ? " open" : "")} aria-label="Cart">
        <header>Cart ({count})<button className="iconbtn" onClick={() => setDrawer(false)} style={{ marginLeft: "auto" }}>✕</button></header>
        <div className="items">
          {lines.length === 0 ? (
            <div className="empty">Your cart is empty.<br /><br /><a className="btn" href="/products">Browse lenses</a></div>
          ) : lines.map((i) => (
            <div className="citem" key={i.id + i.variant}>
              <div className="thumb">{LENS}</div>
              <div style={{ flex: 1, minWidth: 0 }}><b style={{ fontSize: 14 }}>{i.name}</b><br />
                <small>{i.variant} × {i.qty}</small><br /><b>{money(i.line)}</b></div>
              <button className="iconbtn" onClick={() => rmItem(i.id)} aria-label="Remove">✕</button>
            </div>
          ))}
        </div>
        <footer><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}><span>Subtotal</span><b>{money(total)}</b></div>
          <a className="btn" style={{ width: "100%" }} href="/cart">Checkout</a></footer>
      </aside>
      {searchOpen && (
        <div className="modal open"><div className="mbox">
          <button className="iconbtn x" onClick={() => setSearchOpen(false)}>✕</button>
          <h3>Search</h3><p className="sub">Find lenses, kits and accessories.</p>
          <input className="input" placeholder="Search products…" value={term} onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") location.href = "/products?q=" + encodeURIComponent(term); }} />
          <div style={{ marginTop: 12 }}>
            {hits.map((p) => (
              <a className="pick" key={p.id} href={"/product/" + p.slug}><div className="thumb">{LENS}</div>
                <div><h3>{p.name}</h3><b>{money(p.price)}</b></div></a>
            ))}
          </div>
        </div></div>
      )}
      {cookieOpen && (
        <div className="cookie open"><b>Cookies</b>
          <p>We use cookies for cart, currency and analytics.</p>
          <button className="btn" onClick={() => setConsent("all")}>Accept all</button>{" "}
          <button className="btn ghost" onClick={() => setConsent("essential")}>Essential only</button>
        </div>
      )}
      <div className="toasts">
        {toasts.map((t) => <div className="toast" key={t.id}><b style={{ color: "var(--sa-accent)" }}>✓</b><span>{t.msg}</span></div>)}
      </div>
    </div>
  );
}
