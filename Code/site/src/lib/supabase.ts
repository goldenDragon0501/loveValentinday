import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://mpztirmpkyxuqagjvehq.supabase.co";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_zqH_3cySqsNSwiOvki3Zew_TkWfTDN4";

export const supabase: SupabaseClient = createClient(url, anonKey);
