import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { randomBytes } from "crypto";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const MAX_BYTES = 2 * 1024 * 1024;

/**
 * Admin-only image upload. Files land in public/uploads/ (served as /uploads/…);
 * the database keeps only the URL string — never binary blobs.
 * NOTE: on serverless hosts (Netlify/Vercel) the filesystem is ephemeral, so
 * uploads work durably on VPS/Docker/local. For production serverless, paste an
 * image URL in the product form instead (Unsplash, Cloudinary free tier, …).
 */
export async function POST(req: Request) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "admin") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof Blob)) return NextResponse.json({ error: "No file received." }, { status: 400 });
  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be between 1 byte and 2 MB." }, { status: 400 });
  }
  const ext = extname((file as File).name || "").toLowerCase();
  if (!ALLOWED.has(ext)) {
    return NextResponse.json({ error: "Allowed formats: JPG, PNG, WebP." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  // Reject obvious non-images (magic bytes for jpeg/png/webp).
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
  const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const isWebp = buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP";
  if (!isJpeg && !isPng && !isWebp) {
    return NextResponse.json({ error: "File content is not a valid image." }, { status: 400 });
  }
  try {
    const dir = join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const fname = `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;
    await writeFile(join(dir, fname), buf);
    return NextResponse.json({ url: `/uploads/${fname}` });
  } catch (e) {
    console.error("[upload:error]", e);
    return NextResponse.json(
      { error: "Upload storage is unavailable on this host. Paste an image URL instead." },
      { status: 503 }
    );
  }
}
