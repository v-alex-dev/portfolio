import { NextRequest, NextResponse } from "next/server";
import { createSessionToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs"; // ensure Node runtime for cookie and crypto

type BcryptModule = {
  compare: (data: string, encrypted: string) => Promise<boolean>;
};

export async function POST(req: NextRequest) {
  const { email, password } = (await req.json()) as { email?: string; password?: string };
  if (!email || !password) return NextResponse.json({ error: "Missing" }, { status: 400 });

  const inputEmail = email.trim().toLowerCase();

  // Try to find user in DB
  let user = await prisma.user.findUnique({ where: { email: inputEmail } });

  // If no user exists at all, allow bootstrap from env on first login
  if (!user) {
    const count = await prisma.user.count();
    const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const envHash = process.env.ADMIN_PASSWORD_HASH;
    if (count === 0 && envEmail && envHash && inputEmail === envEmail) {
      // Validate password against env hash before creating the user
      let ok = false;
      try {
        if (envHash.startsWith("plain:")) ok = password === envHash.slice(6);
        else {
          const mod = (await import("bcryptjs")) as unknown as BcryptModule | { default?: BcryptModule };
          const compareFn = (mod as BcryptModule).compare ?? (mod as { default?: BcryptModule }).default?.compare;
          ok = typeof compareFn === "function" ? await compareFn(password, envHash) : false;
        }
      } catch {
        ok = false;
      }
      if (ok) {
        user = await prisma.user.create({
          data: { email: inputEmail, passwordHash: envHash, role: "admin" },
        });
      }
    }
  }

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Compare password with stored hash
  const valid = await (async () => {
    try {
      if (user!.passwordHash.startsWith("plain:")) {
        return password === user!.passwordHash.slice(6);
      }
      const mod = (await import("bcryptjs")) as unknown as BcryptModule | { default?: BcryptModule };
      const compareFn = (mod as BcryptModule).compare ?? (mod as { default?: BcryptModule }).default?.compare;
      return typeof compareFn === "function" ? await compareFn(password, user!.passwordHash) : false;
    } catch {
      return false;
    }
  })();

  if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const token = createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
