import { COOKIE_NAME } from "@shared/const";
import { supabase } from "./supabaseClient";

/**
 * Resolve a current Supabase access token for API requests. `getSession()` is
 * intentionally only used in the browser; server-side verification happens in
 * the Express authentication helper before a protected procedure is allowed.
 */
export async function getSupabaseAccessToken() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session?.access_token ?? null;
}

/** Retains the managed-host preview fallback for the existing OAuth session. */
export function getManagedSessionToken() {
  try {
    const raw = sessionStorage.getItem("manus-cookie");
    const prefix = `${COOKIE_NAME}=`;
    const pair = raw?.split(";").find((item) => item.trim().startsWith(prefix));
    return pair?.trim().slice(prefix.length) ?? null;
  } catch {
    return null;
  }
}

export async function getJarvisAuthorizationHeader() {
  const supabaseToken = await getSupabaseAccessToken();
  if (supabaseToken) return `Bearer ${supabaseToken}`;

  const managedToken = getManagedSessionToken();
  return managedToken ? `Bearer ${managedToken}` : null;
}
