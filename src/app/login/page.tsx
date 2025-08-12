"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      router.replace(next);
    } else {
      setError("Identifiants invalides");
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-950 to-black text-slate-100 p-6 sm:p-10 flex items-center justify-center">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6"
      >
        <h1 className="text-xl font-semibold">Connexion</h1>
        <div className="mt-4">
          <label className="block text-sm mb-1">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10"
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm mb-1">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10"
          />
        </div>
        {error && <div className="mt-3 text-sm text-red-400">{error}</div>}
        <button className="mt-6 w-full px-4 py-2 rounded-lg bg-white/10 border border-white/10 hover:bg-white/15">
          Se connecter
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginForm />
    </Suspense>
  );
}
