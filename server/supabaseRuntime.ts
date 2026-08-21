import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

/**
 * The service role is deliberately only constructed in server modules. Browser
 * clients continue to use the publishable key and cannot read private records.
 */
export function getSupabaseRuntimeClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  client = url && serviceRoleKey
    ? createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
    : null;
  return client;
}

/** Vercel is the public production runtime; local/Manus development keeps its existing adapter. */
export function usesSupabasePrivateRuntime() {
  return process.env.VERCEL === "1" && Boolean(getSupabaseRuntimeClient());
}

export function requireSupabaseRuntimeClient() {
  const runtime = getSupabaseRuntimeClient();
  if (!runtime) throw new Error("Jarvis Supabase runtime credentials are unavailable");
  return runtime;
}
