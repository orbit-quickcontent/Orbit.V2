import { createHmac, timingSafeEqual } from "crypto";

function getJwtSecret(): string {
  return process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "orbit_production_jwt_master_secret_2026";
}

export type UserRole = "CLIENT" | "PARTNER" | "EDITOR" | "ADMIN" | "SUPER_ADMIN";

export interface JWTPayload {
  id: string;
  email: string;
  name?: string;
  role: UserRole | string;
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
 * Sign a JWT token with a specified expiration (default: 24 hours for access tokens).
 */
export function signToken(payload: JWTPayload, expiresInSeconds: number = 24 * 60 * 60): string {
  const secret = getJwtSecret();
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = {
    ...payload,
    role: normalizeRole(payload.role),
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signature = createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  const encodedSignature = base64UrlEncode(signature);

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

/**
 * Verify and decode a JWT token using timing-safe signature comparison.
 * Returns null if invalid or expired.
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    if (!token) return null;
    const secret = getJwtSecret();
    const cleanToken = token.replace(/^Bearer\s+/i, "").trim();
    const parts = cleanToken.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    const expectedSignatureBuf = createHmac("sha256", secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest();
    
    // Decode actual signature to buffer for timingSafeEqual
    let actualSignatureBuf: Buffer;
    try {
      let base64Sig = encodedSignature.replace(/-/g, "+").replace(/_/g, "/");
      while (base64Sig.length % 4) base64Sig += "=";
      actualSignatureBuf = Buffer.from(base64Sig, "base64");
    } catch {
      return null;
    }

    if (expectedSignatureBuf.length !== actualSignatureBuf.length) {
      return null;
    }

    if (!timingSafeEqual(expectedSignatureBuf, actualSignatureBuf)) {
      return null;
    }

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
export function normalizeRole(role: string | null | undefined): UserRole {
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
