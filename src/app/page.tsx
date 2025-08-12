import Image from "next/image";
import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import type { Project } from "@/types/project";

async function getProjects(): Promise<Project[]> {
  const file = path.join(process.cwd(), "data", "projects.json");
  try {
    const content = await fs.readFile(file, "utf-8");
    return JSON.parse(content) as Project[];
  } catch {
    return [];
  }
}

export default async function Home() {
  const projects = (await getProjects()).slice(0, 6);
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-950 to-black text-slate-100">
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-black/20 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/next.svg"
              alt="Logo"
              width={32}
              height={32}
              className="invert"
            />
            <span className="font-semibold">Mon Portfolio</span>
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="#projects" className="hover:underline">
              Projets
            </Link>
            <Link href="#contact" className="hover:underline">
              Contact
            </Link>
            <Link href="/projects" className="hover:underline">
              Tous les projets
            </Link>
            <Link href="/admin" className="hover:underline">
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 sm:p-10">
        <section className="mt-4">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl p-8 sm:p-12">
            <div className="absolute -inset-32 bg-gradient-to-tr from-cyan-500/10 via-purple-500/10 to-pink-500/10 blur-3xl" />
            <div className="relative">
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
                Bonjour, je suis Dev
              </h1>
              <p className="mt-4 text-slate-300 max-w-2xl">
                Développeur full‑stack. Voici une sélection de projets récents
                construits avec Next.js, TypeScript et Tailwind.
              </p>
              <div className="mt-6 flex gap-3">
                <Link
                  href="#projects"
                  className="px-5 py-3 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15"
                >
                  Voir mes projets
                </Link>
                <Link
                  href="#contact"
                  className="px-5 py-3 rounded-xl bg-transparent border border-white/20 hover:border-white/40"
                >
                  Me contacter
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="projects" className="mt-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold">
              Aperçu des projets
            </h2>
            <Link
              href="/projects"
              className="text-sm text-slate-300 hover:underline"
            >
              Voir tout
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <Link key={p.slug} href={`/projects/${p.slug}`} className="group">
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl transition-transform duration-200 group-hover:-translate-y-1">
                  <div className="relative h-44 w-full">
                    <Image
                      src={p.image}
                      alt={p.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold">{p.title}</h3>
                    <p className="text-sm text-slate-300 line-clamp-2 mt-1">
                      {p.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {p.technologies.slice(0, 3).map((t) => (
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
            {projects.length === 0 && (
              <div className="col-span-full text-slate-400">
                Aucun projet pour le moment. Ajoutez-en via l'admin.
              </div>
            )}
          </div>
        </section>

        <section id="contact" className="mt-16">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">Contact</h2>
          <ContactForm />
        </section>
      </main>

      <footer className="border-t border-white/10 mt-16">
        <div className="max-w-6xl mx-auto p-6 text-sm text-slate-400">
          © {new Date().getFullYear()} — Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}

function ContactForm() {
  async function action(formData: FormData) {
    "use server";
    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const message = String(formData.get("message") || "");

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/contact`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      }
    );
    if (!res.ok) throw new Error("Contact failed");
  }

  return (
    <form
      action={action}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 max-w-3xl"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Nom</label>
          <input
            name="name"
            required
            className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 outline-none focus:border-white/30"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Email</label>
          <input
            type="email"
            name="email"
            required
            className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 outline-none focus:border-white/30"
          />
        </div>
      </div>
      <div className="mt-4">
        <label className="block text-sm text-slate-300 mb-1">Message</label>
        <textarea
          name="message"
          required
          rows={4}
          className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 outline-none focus:border-white/30"
        />
      </div>
      <button className="mt-4 px-5 py-2 rounded-lg bg-white/10 border border-white/10 hover:bg-white/15">
        Envoyer
      </button>
    </form>
  );
}
