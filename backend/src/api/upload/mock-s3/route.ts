/**
 * Backend API | Mock S3 File Receiver
 *
 * Receives direct PUT requests with raw bytes, simulating direct S3 upload streams.
 * Saves files locally to the `public/upload/` directory.
 *
 * Endpoint: PUT /api/upload/mock-s3?key=...
 */

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "Storage key is required in query parameters" },
        { status: 400 }
      );
    }

    // Clean key and construct file path in the dashboard-web-app public directory
    const cleanKey = path.normalize(key).replace(/^(\.\.(\/|\\))+/, "");
    const targetFilePath = path.join(process.cwd(), "..", "dashboard-web-app", "public", "upload", cleanKey);
    const targetDir = path.dirname(targetFilePath);

    // Ensure directory exists
    await fs.mkdir(targetDir, { recursive: true });

    // Read the request stream as arrayBuffer and convert to Buffer
    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Write file to local disk
    await fs.writeFile(targetFilePath, buffer);

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("Error in mock S3 upload receiver:", error);
    return NextResponse.json(
      { error: "Failed to upload file to mock storage" },
      { status: 500 }
    );
  }
}
