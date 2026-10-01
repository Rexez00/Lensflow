import { getSetting } from "./orders";

export type SiteTheme = {
  store_name: string;
  announcement: string;
  logo_url: string;
  hero_title: string;
  hero_subtitle: string;
  hero_cta_text: string;
  hero_image_url: string;
  hero_image_emoji: string;
  trust_1: string;
  trust_2: string;
  trust_3: string;
  footer_tagline: string;
  accent_color: string;
  featured_title: string;
};

export const THEME_DEFAULTS: SiteTheme = {
  store_name: "Simple Lens",
  announcement: "Free tracked shipping across Morocco on every lens order",
  logo_url: "",
  hero_title: "Unleash\nyour creativity",
  hero_subtitle:
    "Simple Lens makes quality mobile fisheye lenses for a cool, nostalgic aesthetic and macro lenses for professional zoom-ins. Shipped anywhere in Morocco.",
  hero_cta_text: "Shop Now",
  hero_image_url: "",
  hero_image_emoji: "📷",
  trust_1: "Cash on delivery across Morocco",
  trust_2: "Fits almost any phone",
  trust_3: "One-year guarantee",
  footer_tagline: "Pocket-size fisheye and macro lenses for your phone. Based in Morocco, priced in MAD.",
  accent_color: "#7C2DFF",
  featured_title: "Featured Lenses",
};

export async function getSiteTheme(): Promise<SiteTheme> {
  const out = { ...THEME_DEFAULTS } as SiteTheme;
  try {
    for (const k of Object.keys(THEME_DEFAULTS) as (keyof SiteTheme)[]) {
      const v = await getSetting(k, THEME_DEFAULTS[k]);
      if (typeof v === "string" && v !== "") out[k] = v;
      else if (k === "announcement" || k === "logo_url" || k === "hero_image_url") {
        // allow empty on purpose
        out[k] = v ?? "";
      }
    }
  } catch {
    /* DB down — fall back to defaults */
  }
  return out;
}
