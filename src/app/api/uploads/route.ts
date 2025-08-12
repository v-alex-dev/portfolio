import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Expect multipart/form-data with a file field named "file"
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  // Basic validations
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) return NextResponse.json({ error: "File too large" }, { status: 413 });
  const allowed = ["image/png", "image/jpeg", "image/webp", "image/avif", "image/svg+xml"];
  if (!allowed.includes(file.type)) return NextResponse.json({ error: "Unsupported type" }, { status: 415 });

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const key = `projects/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const res = await put(key, arrayBuffer, {
      access: "public",
      contentType: file.type,
    });
    return NextResponse.json({ url: res.url, pathname: res.pathname, contentType: file.type });
  } catch (err: any) {
    const hint = !process.env.BLOB_READ_WRITE_TOKEN ? "BLOB_READ_WRITE_TOKEN missing in env?" : undefined;
    console.error("Blob upload failed:", err);
    return NextResponse.json(
      { error: "Upload failed", details: err?.message ?? String(err), hint },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  // Expect ?path=... (pathname returned by POST) to delete
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });
  await del(path);
  return NextResponse.json({ ok: true });
}
