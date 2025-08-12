import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { del } from "@vercel/blob";

export const runtime = "nodejs";

function safeParseArray(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function toResponse(p: any) {
  return {
    slug: p.slug,
    title: p.title,
    description: p.description,
    image: p.image,
    technologies: safeParseArray(p.technologies as unknown as string),
    languages: safeParseArray(p.languages as unknown as string),
    repoUrl: p.repoUrl ?? undefined,
    demoUrl: p.demoUrl ?? undefined,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const project = await prisma.project.findUnique({
    where: { slug: params.slug },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(toResponse(project));
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  // Auth handled by middleware (session cookie). No header fallback.

  const body = (await req.json()) as Partial<{
    title: string;
    description: string;
    image: string;
    technologies: string[];
    languages: string[];
    repoUrl?: string;
    demoUrl?: string;
  }>;

  const updateData: any = { ...body };
  if (body.technologies) updateData.technologies = JSON.stringify(body.technologies);
  if (body.languages) updateData.languages = JSON.stringify(body.languages);

  try {
    // Get existing project to compare image URLs
    const existing = await prisma.project.findUnique({ where: { slug: params.slug } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const oldImage = existing.image;
    const newImage = typeof body.image === "string" ? body.image : undefined;

    const updated = await prisma.project.update({
      where: { slug: params.slug },
      data: updateData,
    });

    // Best-effort: if image changed and old is a vercel blob, delete old
    if (newImage && oldImage && newImage !== oldImage) {
      try {
        const u = new URL(oldImage);
        if (u.hostname.includes("vercel-storage.com")) {
          await del(oldImage);
        }
      } catch (e) {
        console.warn("Old blob delete skipped/failed:", e);
      }
    }

    return NextResponse.json(toResponse(updated));
  } catch (e: any) {
    if (e.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  // Auth handled by middleware (session cookie). No header fallback.

  try {
    // Fetch the project first to get its image URL
    const project = await prisma.project.findUnique({ where: { slug: params.slug } });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Try to delete the associated blob (best-effort)
    if (project.image) {
      try {
        const u = new URL(project.image);
        const host = u.hostname;
        if (host.includes("vercel-storage.com")) {
          await del(project.image);
        }
      } catch (blobErr) {
        console.warn("Blob delete skipped/failed:", blobErr);
      }
    }

    const removed = await prisma.project.delete({ where: { slug: params.slug } });
    return NextResponse.json(toResponse(removed));
  } catch (e: any) {
    if (e.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
