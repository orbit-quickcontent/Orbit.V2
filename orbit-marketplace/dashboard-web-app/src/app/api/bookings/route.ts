import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";

export async function GET(req: NextRequest) {
  return proxyToBackend(req, "/bookings");
}

export async function POST(req: NextRequest) {
  return proxyToBackend(req, "/bookings");
}
