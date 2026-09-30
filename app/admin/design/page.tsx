import { getSiteTheme } from "@/lib/theme";
import DesignEditor from "@/components/DesignEditor";

export const dynamic = "force-dynamic";

export default async function AdminDesign() {
  const theme = await getSiteTheme();
  return (
    <>
      <h1 style={{ fontSize: 26 }}>Design & Content</h1>
      <p style={{ color: "var(--sa-ink-soft)", fontSize: 14, margin: "6px 0 20px" }}>
        Edit logo, images, colors and every text — no code needed. Like Canva for your store.
      </p>
      <DesignEditor initial={theme} />
    </>
  );
}
