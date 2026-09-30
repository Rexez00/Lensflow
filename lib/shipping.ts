import { db, type Row } from "./db";

export type ShippingMethod = {
  id: number;
  name: string;
  description: string;
  price_cents: number;
  eta: string;
  active: boolean;
  position: number;
};

export async function listShippingMethods(): Promise<ShippingMethod[]> {
  try {
    const rows = (await db()`SELECT * FROM shipping_methods WHERE active = TRUE ORDER BY position, id`) as Row[];
    return rows.map((r) => ({
      id: r.id as number,
      name: String(r.name),
      description: String(r.description ?? ""),
      price_cents: Number(r.price_cents ?? 0),
      eta: String(r.eta ?? ""),
      active: !!r.active,
      position: Number(r.position ?? 0),
    }));
  } catch {
    return [];
  }
}

export async function getShippingMethod(name: string): Promise<ShippingMethod | null> {
  if (!name) return null;
  try {
    const rows = (await db()`SELECT * FROM shipping_methods WHERE name = ${name} AND active = TRUE LIMIT 1`) as Row[];
    const r = rows[0];
    if (!r) return null;
    return {
      id: r.id as number,
      name: String(r.name),
      description: String(r.description ?? ""),
      price_cents: Number(r.price_cents ?? 0),
      eta: String(r.eta ?? ""),
      active: !!r.active,
      position: Number(r.position ?? 0),
    };
  } catch {
    return null;
  }
}
