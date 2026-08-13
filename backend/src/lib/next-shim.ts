/**
 * Standalone NextRequest & NextResponse Shim for Express Runtime
 * Eliminates all heavy Next.js / React peer dependencies in standalone Node.js Express backend.
 */

export class NextResponse extends Response {
  static json(data: any, init?: ResponseInit) {
    const status = init?.status || 200;
    const headers = new Headers(init?.headers);
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
    return new NextResponse(JSON.stringify(data), {
      ...init,
      status,
      headers,
    });
  }

  static redirect(url: string | URL, status = 307) {
    return new NextResponse(null, {
      status,
      headers: { Location: typeof url === "string" ? url : url.toString() },
    });
  }

  static next() {
    return new NextResponse(null, { status: 200 });
  }
}

export interface NextRequest extends Request {
  nextUrl?: URL;
  cookies?: any;
  ip?: string;
  geo?: any;
}
