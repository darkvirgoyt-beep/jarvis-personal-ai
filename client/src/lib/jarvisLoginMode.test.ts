import { describe, expect, it } from "vitest";
import { getJarvisLoginMode } from "./jarvisLoginMode";

describe("getJarvisLoginMode", () => {
  it("preserves the managed OAuth route only when both managed runtime values are present", () => {
    expect(getJarvisLoginMode({ oauthPortalUrl: "https://login.example", appId: "app_jarvis" })).toBe("managed-oauth");
  });

  it("selects Supabase for independently deployed hosts with no managed OAuth callback", () => {
    expect(getJarvisLoginMode({ oauthPortalUrl: "https://login.example" })).toBe("supabase");
    expect(getJarvisLoginMode({ appId: "app_jarvis" })).toBe("supabase");
    expect(getJarvisLoginMode({})).toBe("supabase");
  });
});
