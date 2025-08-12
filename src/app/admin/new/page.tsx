import { redirect } from "next/navigation";
import { headers } from "next/headers";

function getBaseUrl() {
  const envBase = process.env.NEXT_PUBLIC_BASE_URL;
  if (envBase) return envBase.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

type CreatePayload = {
  title: string;
  description: string;
  image: string;
  technologies: string[];
  languages: string[];
  repoUrl?: string;
  demoUrl?: string;
};

async function createProject(formData: FormData) {
  "use server";
  const data = Object.fromEntries(formData) as Record<string, FormDataEntryValue>;

  const base = getBaseUrl();
  const hdrs = await headers();
  const cookieHeader = hdrs.get("cookie") ?? "";

  let imageUrl = String((data.image ?? "").toString().trim());
  const file = formData.get("file") as File | null;
  if (!imageUrl && file && file.size > 0) {
    // Upload the file first
    const fd = new FormData();
    fd.append("file", file);
    const resUpload = await fetch(`${base}/api/uploads`, {
      method: "POST",
      body: fd,
      headers: {
        // forward session cookie for middleware
        cookie: cookieHeader,
      },
    });
    if (!resUpload.ok) {
      let msg = "Upload failed";
      try {
        const j = (await resUpload.json()) as { error?: string; details?: string; hint?: string };
        msg = `${j.error || msg}${j.details ? `: ${j.details}` : ""}${
          j.hint ? ` (${j.hint})` : ""
        }`;
      } catch {}
      throw new Error(msg);
    }
    const up = (await resUpload.json()) as { url: string };
    imageUrl = up.url;
  }

  const payload: CreatePayload = {
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    image: imageUrl,
    technologies: String(data.technologies ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    languages: String(data.languages ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    repoUrl: data.repoUrl ? String(data.repoUrl) : undefined,
    demoUrl: data.demoUrl ? String(data.demoUrl) : undefined,
  };

  if (!payload.image) throw new Error("Image manquante (URL ou fichier)");

  const res = await fetch(`${base}/api/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // forward session cookie for middleware
      cookie: cookieHeader,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let msg = "Failed to create project";
    try {
      const j = (await res.json()) as { error?: string };
      msg = `${j.error || msg}`;
    } catch {}
    throw new Error(msg);
  }
  redirect("/admin");
}

export default function NewProjectPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-950 to-black text-slate-100 p-6 sm:p-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold">Nouveau projet</h1>
        <form action={createProject} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm mb-1">Titre</label>
            <input
              name="title"
              required
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Description</label>
            <textarea
              name="description"
              rows={4}
              required
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Image (URL) ou Fichier</label>
            <input
              name="image"
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10"
            />
            <input
              type="file"
              name="file"
              accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
              className="mt-2 w-full px-3 py-2 rounded-md bg-black/30 border border-white/10"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">
              Technologies (séparées par des virgules)
            </label>
            <input
              name="technologies"
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">
              Langages (séparés par des virgules)
            </label>
            <input
              name="languages"
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Repo URL</label>
              <input
                name="repoUrl"
                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Demo URL</label>
              <input
                name="demoUrl"
                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10"
              />
            </div>
          </div>
          <button className="px-5 py-2 rounded-lg bg-white/10 border border-white/10 hover:bg-white/15">
            Créer
          </button>
        </form>
      </div>
    </div>
  );
}
