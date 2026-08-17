export type JarvisLoginMode = "managed-oauth" | "supabase";

export function getJarvisLoginMode(config: { oauthPortalUrl?: string; appId?: string }): JarvisLoginMode {
  return config.oauthPortalUrl?.trim() && config.appId?.trim() ? "managed-oauth" : "supabase";
}
