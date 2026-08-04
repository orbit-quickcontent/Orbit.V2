import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

function addCorsHeaders(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

export async function middleware(request: NextRequest) {
  // 1. Handle CORS OPTIONS preflight request
  if (request.method === "OPTIONS") {
    return addCorsHeaders(new NextResponse(null, { status: 204 }));
  }

  const host = request.headers.get("host") || "";
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1") || host.includes("10.0.2.2") || process.env.NODE_ENV === "development";

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || "orbit-super-secret-jwt-key",
  });

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
