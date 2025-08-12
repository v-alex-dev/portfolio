import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic"; // ensure fresh data in dev

export default async function AdminPage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-950 to-black text-slate-100 p-6 sm:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">Admin — Projets</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/new"
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 hover:bg-white/15"
            >
              Nouveau projet
            </Link>
            <form
              action={async () => {
                "use server";
                await fetch("/api/auth/logout", { method: "POST" });
              }}
            >
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 hover:bg-white/15"
              >
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {projects.map((p) => (
            <div
              key={p.slug}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 backdrop-blur p-4"
            >
              <div>
                <div className="font-semibold">{p.title}</div>
                <div className="text-sm text-slate-400">/{p.slug}</div>
              </div>
              <div className="flex gap-3">
                <Link
                  href={`/projects/${p.slug}`}
                  className="text-sm underline"
                >
                  Voir
                </Link>
                <Link
                  href={`/admin/edit/${p.slug}`}
                  className="text-sm underline"
                >
                  Editer
                </Link>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="text-slate-400">Aucun projet. Créez-en un.</div>
          )}
        </div>
      </div>
    </div>
  );
}
