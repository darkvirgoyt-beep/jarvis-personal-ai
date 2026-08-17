import type { SupabaseClient } from "@supabase/supabase-js";

export type JarvisOAuthProvider = "google" | "github";

export function getJarvisAuthReturnUrl(origin: string) {
  return `${origin.replace(/\/$/, "")}/?auth=complete`;
}

export async function beginJarvisOAuthSignIn(
  client: SupabaseClient,
  provider: JarvisOAuthProvider,
  origin: string,
) {
  const { data, error } = await client.auth.signInWithOAuth({
    provider,
    options: { redirectTo: getJarvisAuthReturnUrl(origin) },
  });

  if (error) throw error;
  if (!data.url) throw new Error("Jarvis could not begin the secure provider sign-in.");

  return data.url;
}
