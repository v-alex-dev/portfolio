import { NextResponse, NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const isProtected =
    pathname.startsWith("/admin") ||
    ((pathname.startsWith("/api/projects") || pathname.startsWith("/api/uploads")) && req.method !== "GET");

  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get("session")?.value;
  const valid = await verifySessionToken(token);
  if (!valid) {
    if (pathname.startsWith("/admin")) {
      const url = new URL("/login", req.url);
      url.searchParams.set("next", `${pathname}${search || ""}`);
      return NextResponse.redirect(url);
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/projects",
    "/api/projects/:path*",
    "/api/uploads",
  ],
};
