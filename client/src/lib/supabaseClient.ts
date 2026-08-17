import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

/** Browser-safe Supabase client. The service-role key is never available here. */
export const hasSupabaseAuthConfiguration = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase: SupabaseClient | null = hasSupabaseAuthConfiguration
  ? createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function requireSupabaseClient() {
  if (!supabase) {
    throw new Error("Jarvis sign-in is not configured for this deployment.");
  }
  return supabase;
}
