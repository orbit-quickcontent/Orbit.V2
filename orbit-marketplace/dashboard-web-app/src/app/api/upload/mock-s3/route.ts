import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";

export async function PUT(req: NextRequest) {
  return proxyToBackend(req, "/upload/mock-s3");
}
