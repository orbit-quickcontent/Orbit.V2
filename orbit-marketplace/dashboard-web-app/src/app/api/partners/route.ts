import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";

export async function GET(req: NextRequest) {
  return proxyToBackend(req, "/partners");
}

export async function POST(req: NextRequest) {
  return proxyToBackend(req, "/partners");
}
