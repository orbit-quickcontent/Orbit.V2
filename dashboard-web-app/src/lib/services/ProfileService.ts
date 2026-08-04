import { supabase } from "@/lib/supabase-client";

export interface ProfileRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'client' | 'partner' | 'editor' | 'admin' | 'super_admin';
  avatar_url?: string;
  avatar_emoji?: string;
  persona?: string;
  status?: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'SUSPENDED';
}

export class ProfileService {
  static async getCurrentProfile(): Promise<ProfileRecord | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !data) return null;
    return data as ProfileRecord;
  }

  static async updateProfile(profileId: string, updates: Partial<ProfileRecord>): Promise<ProfileRecord | null> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profileId)
      .select()
      .single();

    if (error) throw error;
    return data as ProfileRecord;
  }
}
