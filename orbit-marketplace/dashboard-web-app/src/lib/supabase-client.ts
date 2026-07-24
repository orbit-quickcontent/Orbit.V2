import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://stlwhzryieptzhfvbqbd.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0bHdoenJ5aWVwdHpoZnZicWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MTc0ODEsImV4cCI6MjA2NzA5MzQ4MX0.placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
