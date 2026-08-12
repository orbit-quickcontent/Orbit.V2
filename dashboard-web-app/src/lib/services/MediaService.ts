/**
 * MediaService — Orbit backend API client
 * Replaces the old Supabase Storage-based implementation.
 * Uses the backend presigned-URL + mock-S3 upload flow.
 */

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

function getAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = typeof window !== "undefined" ? (localStorage.getItem("orbit_token") || "") : "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export class MediaService {
  /**
   * Request a presigned upload URL from the backend, then upload the file to it.
   * Returns the relative path of the uploaded file.
   */
  static async uploadMedia(_bucket: string, filePath: string, file: File): Promise<string> {
    // 1. Get a presigned URL for this file
    const presignRes = await fetch(`${API}/upload/presigned-url`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ fileName: filePath, fileType: file.type, fileSize: file.size }),
    });
    if (!presignRes.ok) throw new Error(`Presigned URL request failed: ${await presignRes.text()}`);
    const { uploadUrl, key } = await presignRes.json();

    // 2. Upload the raw file to the presigned URL
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
    if (!uploadRes.ok) throw new Error(`File upload failed: ${uploadRes.status}`);

    return key as string;
  }

  /**
   * Get a signed URL for a stored file.
   * Returns the same key — presigned URLs are generated on the backend via generatePresignedUrl().
   */
  static async getSignedUrl(_bucket: string, fileKey: string, _expiresInSeconds = 3600): Promise<string> {
    const res = await fetch(`${API}/upload/presigned-url`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ fileName: fileKey, fileType: "application/octet-stream", fileSize: 0, readOnly: true }),
    });
    if (!res.ok) return fileKey; // fallback to the key itself
    const data = await res.json();
    return data.downloadUrl || data.uploadUrl || fileKey;
  }
}
