import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { del } from "@vercel/blob";

export const runtime = "nodejs";

type ProjectResponse = {
  slug: string;
  title: string;
  description: string;
  image: string;
  technologies: string[];
  languages: string[];
  repoUrl?: string;
  demoUrl?: string;
  createdAt: string;
  updatedAt: string;
};

function safeParseArray(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function toResponse(p: {
  slug: string;
  title: string;
  description: string;
  image: string;
  technologies: string | null;
  languages: string | null;
  repoUrl: string | null;
  demoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ProjectResponse {
  return {
    slug: p.slug,
    title: p.title,
    description: p.description,
    image: p.image,
    technologies: safeParseArray(p.technologies ?? undefined),
    languages: safeParseArray(p.languages ?? undefined),
    repoUrl: p.repoUrl ?? undefined,
    demoUrl: p.demoUrl ?? undefined,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const project = await prisma.project.findUnique({
    where: { slug },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(toResponse(project));
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
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

  const updateData: Record<string, unknown> = { ...body };
  if (body.technologies) updateData.technologies = JSON.stringify(body.technologies);
  if (body.languages) updateData.languages = JSON.stringify(body.languages);

  try {
    const { slug } = await params;
    // Get existing project to compare image URLs
    const existing = await prisma.project.findUnique({ where: { slug } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const oldImage = existing.image;
    const newImage = typeof body.image === "string" ? body.image : undefined;

    const updated = await prisma.project.update({
      where: { slug },
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
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Auth handled by middleware (session cookie). No header fallback.

  try {
    const { slug } = await params;
    // Fetch the project first to get its image URL
    const project = await prisma.project.findUnique({ where: { slug } });
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

    const removed = await prisma.project.delete({ where: { slug } });
    return NextResponse.json(toResponse(removed));
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
