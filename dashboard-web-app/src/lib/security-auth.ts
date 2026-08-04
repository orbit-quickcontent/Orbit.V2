import { createHmac } from "crypto";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "orbit-super-secret-jwt-key";

export interface JWTPayload {
  id: string;
  email: string;
  name?: string;
  role: string;
  type?: "access" | "refresh" | "reset";
  iat?: number;
  exp?: number;
}

function base64UrlEncode(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

/**
 * Sign a JWT token with a specified expiration.
 */
export function signToken(payload: JWTPayload, expiresInSeconds: number = 15 * 60): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signature = createHmac("sha256", JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  const encodedSignature = base64UrlEncode(signature);

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

/**
 * Verify and decode a JWT token. Returns null if invalid or expired.
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    if (!token) return null;
    const cleanToken = token.replace(/^Bearer\s+/i, "").trim();
    const parts = cleanToken.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    const expectedSignature = base64UrlEncode(
      createHmac("sha256", JWT_SECRET)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest()
    );

    if (encodedSignature !== expectedSignature) return null;

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JWTPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Maps role strings to standardized role format (CLIENT, PARTNER, EDITOR, ADMIN, SUPER_ADMIN).
 */
export function normalizeRole(role: string | null | undefined): string {
  if (!role) return "CLIENT";
  const r = role.toUpperCase().trim();
  if (r === "USER" || r === "CLIENT") return "CLIENT";
  if (r === "PARTNER" || r === "SHOOTER") return "PARTNER";
  if (r === "EDITOR") return "EDITOR";
  if (r === "ADMIN") return "ADMIN";
  if (r === "SUPER_ADMIN" || r === "SUPERADMIN") return "SUPER_ADMIN";
  return "CLIENT";
}

/**
 * Returns the default post-login redirect path for a given role.
 */
export function getRoleRedirectUrl(role: string): string {
  const normRole = normalizeRole(role);
  switch (normRole) {
    case "PARTNER":
      return "/partner";
    case "EDITOR":
      return "/editor";
    case "ADMIN":
      return "/admin";
    case "SUPER_ADMIN":
      return "/admin?view=super_admin";
    case "CLIENT":
    default:
      return "/";
  }
}
