import { createClient as createBrowserClient } from "@supabase/supabase-js";

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase env variables missing.");
}

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

