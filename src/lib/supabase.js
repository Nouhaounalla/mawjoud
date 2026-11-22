import { createClient } from "@supabase/supabase-js";

// These two values come from the ".env.local" file (see .env.local.example).
// Variables that start with NEXT_PUBLIC_ are available in the browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// True when both values are filled in. The layout uses this to show a
// friendly "please configure Supabase" banner instead of a cryptic crash.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// One shared Supabase client for the whole app.
// The placeholders only exist so the app can still start without a .env.local file.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);
