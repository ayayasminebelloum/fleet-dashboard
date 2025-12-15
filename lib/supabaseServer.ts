import { createClient } from "@supabase/supabase-js";

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is required in environment variables");
}

if (!supabaseKey) {
  throw new Error("SUPABASE_ANON_KEY is required in environment variables");
}

export const supabaseServer = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: { persistSession: false },
  }
);