import type { SupabaseClient } from "@supabase/supabase-js";

export function getJarvisPasswordResetReturnUrl(origin: string) {
  return `${origin.replace(/\/$/, "")}/reset-password`;
}

export async function beginJarvisPasswordReset(
  client: SupabaseClient,
  email: string,
  origin: string,
) {
  const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: getJarvisPasswordResetReturnUrl(origin),
  });

  if (error) throw error;
}
