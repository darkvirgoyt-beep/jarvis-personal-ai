import { describe, expect, it } from "vitest";
import { getUserByOpenId } from "./supabaseJarvisDb";
import { getSupabaseRuntimeClient } from "./supabaseRuntime";

const canRunIntegration = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

describe("Supabase private runtime integration", () => {
  it.skipIf(!canRunIntegration)("uses only the server role to resolve an existing Jarvis profile", async () => {
    const runtime = getSupabaseRuntimeClient();
    expect(runtime).not.toBeNull();

    const { data, error } = await runtime!.from("jarvis_users").select("open_id").limit(1).maybeSingle();
    expect(error).toBeNull();
    expect(data?.open_id).toBeTruthy();

    const profile = await getUserByOpenId(data!.open_id);
    expect(profile?.openId).toBe(data!.open_id);
  });
});
