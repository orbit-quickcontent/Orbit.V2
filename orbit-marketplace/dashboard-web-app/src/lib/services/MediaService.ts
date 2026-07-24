import { supabase } from "@/lib/supabase-client";

export class MediaService {
  static async uploadMedia(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    if (error) throw error;
    return data;
  }

  static async getSignedUrl(bucket: string, path: string, expiresInSeconds = 3600) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSeconds);

    if (error) throw error;
    return data.signedUrl;
  }
}
