import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";

function parseArray(s: unknown): string[] {
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

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-950 to-black text-slate-100 p-6 sm:p-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-5xl font-bold mb-8">Mes Projets</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <Link key={p.slug} href={`/projects/${p.slug}`} className="group">
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl transition-transform duration-200 group-hover:-translate-y-1">
                <div className="relative h-48 w-full">
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-semibold">{p.title}</h2>
                  <p className="text-sm text-slate-300 line-clamp-2 mt-1">
                    {p.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {parseArray(p.technologies)
                      .slice(0, 3)
                      .map((t) => (
                        <span
                          key={t}
                          className="px-2 py-1 text-xs rounded-full bg-white/10 border border-white/10"
                        >
                          {t}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
