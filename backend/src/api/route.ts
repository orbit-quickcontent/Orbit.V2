/**
 * Health Check API
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok", service: "Orbit API", version: "2.0" });
}
