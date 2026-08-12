import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function addCorsHeaders(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

function getAuthTokenPayload(request: NextRequest): { role?: string; id?: string } | null {
  try {
    const authHeader = request.headers.get("authorization");
    const cookieToken =
      request.cookies.get("auth_token")?.value ||
      request.cookies.get("next-auth.session-token")?.value;
    const rawToken = authHeader ? authHeader.replace("Bearer ", "").trim() : cookieToken;
    if (!rawToken) return null;
    const parts = rawToken.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  // 1. Handle CORS OPTIONS preflight request
  if (request.method === "OPTIONS") {
    return addCorsHeaders(new NextResponse(null, { status: 204 }));
  }

  const host = request.headers.get("host") || "";
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1") || host.includes("10.0.2.2") || process.env.NODE_ENV === "development";

  const token = getAuthTokenPayload(request);

  const { pathname } = request.nextUrl;

  // Protect Admin dashboard & admin APIs
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!isLocal) {
      if (!token) {
        const loginUrl = new URL("/", request.url);
        return NextResponse.redirect(loginUrl);
      }

      if (token.role !== "ADMIN") {
        const unauthorizedUrl = new URL("/", request.url);
        return NextResponse.redirect(unauthorizedUrl);
      }
    }
  }

  // Protect partner APIs
  if (pathname.startsWith("/api/partners") && request.method !== "POST") {
    if (!isLocal && !token) {
      return addCorsHeaders(NextResponse.json({ error: "Authentication required" }, { status: 401 }));
    }
  }

  // Protect client bookings APIs
  if (pathname.startsWith("/api/bookings")) {
    if (!isLocal && !token) {
      return addCorsHeaders(NextResponse.json({ error: "Authentication required" }, { status: 401 }));
    }
  }

  // Apply CORS headers to successful backend API responses
  const response = NextResponse.next();
  if (pathname.startsWith("/api")) {
    addCorsHeaders(response);
  }
  return response;
}

// Specify matchers for routes to run middleware
export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/bookings/:path*",
    "/api/partners/:path*",
  ],
};
