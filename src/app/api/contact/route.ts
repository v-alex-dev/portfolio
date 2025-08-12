import { NextRequest, NextResponse } from "next/server";

// Minimal contact endpoint - logs to server. Replace with real mail provider (Resend, SendGrid, etc.)
export async function POST(req: NextRequest) {
  const { name, email, message } = (await req.json()) as {
    name?: string;
    email?: string;
    message?: string;
  };

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  console.log("CONTACT_MESSAGE", { name, email, message, at: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
