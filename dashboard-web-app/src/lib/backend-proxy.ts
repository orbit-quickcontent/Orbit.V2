import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_API_URL || "http://localhost:5000/api";

/**
 * Proxies a Next.js App Router request to the orbit-marketplace/backend Express server.
 */
export async function proxyToBackend(req: NextRequest, targetPath: string): Promise<NextResponse> {
  try {
    const incomingUrl = new URL(req.url);
    const targetUrl = new URL(`${BACKEND_API_URL}${targetPath}`);
    targetUrl.search = incomingUrl.search;

    const headers = new Headers();
    req.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower !== "host" && lower !== "connection" && lower !== "content-length") {
        headers.set(key, value);
      }
    });

    let body: BodyInit | null = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await req.arrayBuffer();
    }

    const res = await fetch(targetUrl.toString(), {
      method: req.method,
      headers,
      body,
    });

    const resBuffer = await res.arrayBuffer();
    const resHeaders = new Headers();
    res.headers.forEach((val, key) => {
      const lower = key.toLowerCase();
      if (lower !== "content-length" && lower !== "transfer-encoding") {
        resHeaders.set(key, val);
      }
    });

    return new NextResponse(resBuffer, {
      status: res.status,
      statusText: res.statusText,
      headers: resHeaders,
    });
  } catch (error: any) {
    console.error(`Proxy to backend target ${targetPath} failed:`, error);
    return NextResponse.json(
      { error: "Backend proxy service unavailable", details: error.message },
      { status: 503 }
    );
  }
}
