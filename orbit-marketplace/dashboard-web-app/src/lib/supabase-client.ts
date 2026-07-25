import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://stlwhzryieptzhfvbqbd.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_KyB9qOWcwTtO0nn9l-nFjw_rpEx92iT";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
