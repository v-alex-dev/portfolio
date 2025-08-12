const ENC = new TextEncoder();

function base64url(input: string) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function hex(buf: ArrayBuffer | Uint8Array) {
  const u8 = buf instanceof ArrayBuffer ? new Uint8Array(buf) : (buf as Uint8Array);
  return Array.from(u8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Decode base64url to UTF-8 string (Edge-compatible)
function b64urlToUtf8(encoded: string): string {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  // Prefer Web API in Edge
  if (typeof (globalThis as any).atob === "function") {
    const binary = (globalThis as any).atob(padded) as string;
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  // Fallback Node
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("buffer").Buffer.from(padded, "base64").toString("utf8");
}

export function createSessionToken() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Missing AUTH_SECRET env var");
  const now = Math.floor(Date.now() / 1000);
  const payload = { sub: "admin", iat: now, exp: now + 60 * 60 * 24 * 7 };
  const encoded = base64url(JSON.stringify(payload));
  try {
    // Node crypto HMAC
    const { createHmac } = require("crypto") as typeof import("crypto");
    const sig = createHmac("sha256", secret).update(encoded).digest("hex");
    return `${encoded}.${sig}`;
  } catch {
    // Edge fallback not supported for create in this API route
    throw new Error("createSessionToken not supported in Edge runtime");
  }
}

async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  // Try Node first
  try {
    const { createHmac } = require("crypto") as typeof import("crypto");
    return createHmac("sha256", secret).update(message).digest("hex");
  } catch {
    const subtle = (globalThis as any).crypto?.subtle;
    if (!subtle) throw new Error("No crypto available");
    const key = await subtle.importKey(
      "raw",
      ENC.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await subtle.sign({ name: "HMAC" }, key, ENC.encode(message));
    return hex(sig as ArrayBuffer);
  }
}

export async function verifySessionToken(token?: string): Promise<boolean> {
  try {
    if (!token) return false;
    const secret = process.env.AUTH_SECRET;
    if (!secret) return false;
    const [encoded, sig] = token.split(".");
    if (!encoded || !sig) return false;
    const expected = await hmacSha256Hex(encoded, secret);
    if (expected !== sig) return false;
    const json = JSON.parse(b64urlToUtf8(encoded));
    if (typeof json.exp !== "number") return false;
    if (json.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}
