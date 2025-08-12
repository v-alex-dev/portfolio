import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";

function getBaseUrl() {
  const envBase = process.env.NEXT_PUBLIC_BASE_URL;
  if (envBase) return envBase.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

async function updateProject(slug: string, formData: FormData) {
  "use server";
  const data = Object.fromEntries(formData) as any;
  const payload: any = {
    title: String(data.title),
    description: String(data.description),
    image: String(data.image),
    technologies: String(data.technologies || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    languages: String(data.languages || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    repoUrl: data.repoUrl ? String(data.repoUrl) : null,
    demoUrl: data.demoUrl ? String(data.demoUrl) : null,
  };

  const base = getBaseUrl();
  const hdrs = await headers();
  const cookieHeader = hdrs.get("cookie") ?? "";

  const res = await fetch(`${base}/api/projects/${slug}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      cookie: cookieHeader,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to update project");
  redirect("/admin");
}

function parseArray(s: any): string[] {
  if (Array.isArray(s)) return s as string[];
  if (typeof s === "string") {
    try {
      const v = JSON.parse(s);
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default async function EditProjectPage({
  params,
}: {
  params: { slug: string };
}) {
  const p = await prisma.project.findUnique({ where: { slug: params.slug } });
  if (!p) return notFound();

  const techs = parseArray((p as any).technologies);
  const langs = parseArray((p as any).languages);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-950 to-black text-slate-100 p-6 sm:p-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold">Editer: {p.title}</h1>
        <form
          action={updateProject.bind(null, p.slug)}
          className="mt-6 space-y-4"
        >
          <div>
            <label className="block text-sm mb-1">Titre</label>
            <input
              name="title"
              defaultValue={p.title}
              required
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Description</label>
            <textarea
              name="description"
              rows={4}
              defaultValue={p.description}
              required
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Image (URL)</label>
            <input
              name="image"
              defaultValue={p.image}
              required
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">
              Technologies (séparées par des virgules)
            </label>
            <input
              name="technologies"
              defaultValue={techs.join(", ")}
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">
              Langages (séparés par des virgules)
            </label>
            <input
              name="languages"
              defaultValue={langs.join(", ")}
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Repo URL</label>
              <input
                name="repoUrl"
                defaultValue={p.repoUrl ?? ""}
                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Demo URL</label>
              <input
                name="demoUrl"
                defaultValue={p.demoUrl ?? ""}
                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2 rounded-lg bg-white/10 border border-white/10 hover:bg-white/15">
              Enregistrer
            </button>
            <form
              action={async () => {
                "use server";
                const base = getBaseUrl();
                const hdrs = await headers();
                const cookieHeader = hdrs.get("cookie") ?? "";
                await fetch(`${base}/api/projects/${p.slug}`, {
                  method: "DELETE",
                  headers: { cookie: cookieHeader },
                });
                redirect("/admin");
              }}
            >
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-red-500/20 border border-red-500/30 hover:bg-red-500/30"
              >
                Supprimer
              </button>
            </form>
          </div>
        </form>
      </div>
    </div>
  );
}
