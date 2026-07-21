/**
 * Backend API | S3 Pre-signed URL Generator (Mock)
 *
 * Generates mock pre-signed upload URLs for partners to upload raw video footage
 * directly to a mock local cloud storage endpoint.
 *
 * Endpoint: POST /api/upload/presigned-url
 */

import { NextRequest, NextResponse } from "next/server";
import { getPresignedUploadUrl } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, contentType, bookingId } = body;

    if (!filename || !bookingId) {
      return NextResponse.json(
        { error: "filename and bookingId are required" },
        { status: 400 }
      );
    }

    // Generate target key: bookings/[bookingId]/[filename]
    const key = `bookings/${bookingId}/${filename}`;

    // Generate production-grade S3 upload URL or local receiver URL fallback
    const uploadUrl = await getPresignedUploadUrl(key, contentType || "video/mp4");

    return NextResponse.json({
      url: uploadUrl,
      key,
    });
  } catch (error: any) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned URL", details: error.message },
      { status: 500 }
    );
  }
}
