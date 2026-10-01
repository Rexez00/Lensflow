/**
 * Transactional email helper (Resend free tier via HTTPS — no extra dependency).
 *
 * Configure to actually send mail:
 *   RESEND_API_KEY=re_…        (https://resend.com — free tier available)
 *   EMAIL_FROM="Simple Lens <store@yourdomain>"
 *
 * When unconfigured, sendEmail() logs to the server console and reports
 * { sent: false } so callers can show honest UI ("email not configured")
 * instead of pretending a message went out.
 */

export async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Simple Lens <onboarding@resend.dev>";
  if (!key) {
    console.log(`[email:unconfigured] to=${to} subject=${subject}`);
    return { sent: false as const, reason: "Email provider not configured (RESEND_API_KEY)." };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[email:failed]", res.status, text);
    return { sent: false as const, reason: `Email provider error (${res.status}).` };
  }
  return { sent: true as const };
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}
