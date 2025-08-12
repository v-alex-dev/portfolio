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

export async function generateStaticParams() {
  const projects = await prisma.project.findMany({ select: { slug: true } });
  return projects.map((p) => ({ slug: p.slug }));
}

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await prisma.project.findUnique({
    where: { slug },
  });
  if (!project) return <div className="p-10">Projet introuvable.</div>;

  const technologies = parseArray(project.technologies);
  const languages = parseArray(project.languages);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-950 to-black text-slate-100 p-6 sm:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl">
          <div className="relative h-64 w-full">
            <Image
              src={project.image}
              alt={project.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="p-6">
            <h1 className="text-3xl font-bold">{project.title}</h1>
            <p className="mt-3 text-slate-300">{project.description}</p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Technologies</h3>
                <div className="flex flex-wrap gap-2">
                  {technologies.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-1 text-xs rounded-full bg-white/10 border border-white/10"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Langages</h3>
                <div className="flex flex-wrap gap-2">
                  {languages.map((t) => (
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
            <div className="mt-6 flex gap-3">
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 hover:bg-white/15"
                >
                  Code
                </a>
              )}
              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 hover:bg-white/15"
                >
                  Demo
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
