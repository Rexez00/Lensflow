/**
 * Central storefront API client.
 * All browser → backend communication for shop data goes through here,
 * so backend URLs/shapes live in one place instead of scattered fetch() calls.
 *
 * Backend: self-contained Next.js Route Handlers + PostgreSQL
 * (see /api/products, /api/cart, /api/search, /api/shipping, /api/orders).
 */

export type ApiProduct = {
  id: number;
  name: string;
  slug: string;
  sub: string;
  price_cents: number;
  old_cents: number | null;
  stock: number;
  rating: number;
  rating_count: number;
  image_url: string;
  badge: string;
  featured: boolean;
  cat_slug: string | null;
  cat_name: string | null;
};

export type ApiVariant = {
  id: number;
  name: string;
  sku: string;
  price_cents: number | null;
  stock: number | null;
  effective_price: number;
  effective_stock: number;
};

export type ApiCartLine = {
  id: number;
  name: string;
  slug: string;
  variant: string;
  qty: number;
  price: number;
  line: number;
  image_url: string;
  max_stock: number;
};

export type ApiCart = { items: ApiCartLine[]; total: number; count: number; coupon: string };

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  async products(params: Record<string, string | number | undefined> = {}): Promise<{ items: ApiProduct[]; page: number; pages: number; total: number }> {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") sp.set(k, String(v));
    const res = await fetch(`/api/products?${sp.toString()}`, { cache: "no-store" });
    return json(res);
  },
  async product(slug: string): Promise<{ product: ApiProduct; variants: ApiVariant[]; images: string[] } | null> {
    const res = await fetch(`/api/products/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (res.status === 404) return null;
    return json(res);
  },
  async cart(): Promise<ApiCart> {
    const res = await fetch("/api/cart", { cache: "no-store" });
    return json(res);
  },
  async cartOp(body: Record<string, unknown>): Promise<ApiCart> {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return json(res);
  },
  async search(q: string): Promise<ApiProduct[]> {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
    return json(res);
  },
  async shipping(): Promise<{ id: number; name: string; description: string; price_cents: number; eta: string }[]> {
    const res = await fetch("/api/shipping", { cache: "no-store" });
    return json(res);
  },
  async myOrders(): Promise<{ code: string; total_cents: number; status: string; created: string }[]> {
    const res = await fetch("/api/orders", { cache: "no-store" });
    if (!res.ok) return [];
    return json(res);
  },
};
