import crypto from "crypto";

const SECRET_KEY = process.env.PRESIGNED_SECRET_KEY || "orbit_ultra_secure_video_pipeline_2026";

/**
 * Generate a cryptographically secure Presigned URL for video assets.
 * Valid for exactly 15 minutes.
 */
export function generatePresignedUrl(urlPath: string): string {
  if (!urlPath) return "";
  
  // Expiry timestamp: current time + 15 minutes
  const expires = Date.now() + 15 * 60 * 1000;
  
  // Create signature based on clean path + expiry timestamp
  const cleanPath = urlPath.split("?")[0];
  const hmac = crypto.createHmac("sha256", SECRET_KEY);
  hmac.update(`${cleanPath}:${expires}`);
  const token = hmac.digest("hex");
  
  // Append security parameters
  const separator = urlPath.includes("?") ? "&" : "?";
  return `${urlPath}${separator}token=${token}&expires=${expires}`;
}

/**
 * Validate a query signature token for secure file streaming.
 */
export function validatePresignedToken(urlPath: string, token: string | null, expiresStr: string | null): boolean {
  if (!token || !expiresStr) {
    return false;
  }
  
  const expires = parseInt(expiresStr, 10);
  if (isNaN(expires) || expires < Date.now()) {
    console.warn("[Presigned Security] Asset access attempt failed: Token expired.");
    return false;
  }
  
  const cleanPath = urlPath.split("?")[0];
  const hmac = crypto.createHmac("sha256", SECRET_KEY);
  hmac.update(`${cleanPath}:${expiresStr}`);
  const expectedToken = hmac.digest("hex");
  
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
}
