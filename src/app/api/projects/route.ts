import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Project as DBProject } from "@prisma/client";

function slugify(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function ensureUniqueSlug(base: string) {
  let slug = base;
  let i = 1;
  // Check existence and append -2, -3, ...
  while (await prisma.project.findUnique({ where: { slug } })) {
    i += 1;
    slug = `${base}-${i}`;
  }
  return slug;
}

function safeParseArray(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function toResponse(p: DBProject) {
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

export async function GET() {
  const projects = await prisma.project.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(projects.map(toResponse));
}

export async function POST(req: NextRequest) {
  // Auth handled by middleware (session cookie).

  const body = (await req.json()) as Partial<{
    title: string;
    description: string;
    image: string;
    technologies: string[];
    languages: string[];
    repoUrl?: string;
    demoUrl?: string;
  }>;

  if (!body.title || !body.description || !body.image) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const base = slugify(body.title);
  const slug = await ensureUniqueSlug(base);

  try {
    const created = await prisma.project.create({
      data: {
        slug,
        title: body.title,
        description: body.description,
        image: body.image,
        technologies: JSON.stringify(body.technologies ?? []),
        languages: JSON.stringify(body.languages ?? []),
        repoUrl: body.repoUrl,
        demoUrl: body.demoUrl,
      },
    });
    return NextResponse.json(toResponse(created), { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
