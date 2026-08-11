import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://stlwhzryieptzhfvbqbd.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0bHdoenJ5aWVwdHpoZnZicWJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDY4NzcwOCwiZXhwIjoyMTAwMjYzNzA4fQ.QDjnYABg8aRpKoU1A67QDzm05ZjNZFdkO1uL6E3YdGk';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

/**
 * Helper to verify a Supabase JWT token.
 */
export async function verifySupabaseToken(token: String) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token.toString());
    if (error || !user) return null;
    return user;
  } catch (e) {
    console.error('❌ [Supabase] Token verification error:', e);
    return null;
  }
}
