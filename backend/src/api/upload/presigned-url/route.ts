import { NextRequest, NextResponse } from "next/server";
import { createUploadUrl } from "../../../services/storage.service";

export async function POST(request: NextRequest) {
  try {
    const { filename, contentType, bookingId } = (await request.json()) as {
      filename?: string;
      contentType?: string;
      bookingId?: string;
    };

    if (!filename || !bookingId) {
      return NextResponse.json({ error: "filename and bookingId are required" }, { status: 400 });
    }

    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `bookings/${bookingId}/raw/${Date.now()}-${safeFilename}`;
    const uploadUrl = await createUploadUrl(key, contentType || "video/mp4");

    return NextResponse.json({ url: uploadUrl, key, expiresInSeconds: 900 });
  } catch (error: any) {
    console.error("Error generating upload URL:", error);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
