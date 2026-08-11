import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://stlwhzryieptzhfvbqbd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0bHdoenJ5aWVwdHpoZnZicWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2ODc3MDgsImV4cCI6MjEwMDI2MzcwOH0.TP0M-uoiJOptB7BSbElPX-B5bbdx9sBql8CwPAKwKbw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});
