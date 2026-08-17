import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));

vi.mock("./supabaseClient", () => ({
  supabase: { auth: { getSession } },
}));

import { getJarvisAuthorizationHeader } from "./authToken";

describe("getJarvisAuthorizationHeader", () => {
  beforeEach(() => {
    getSession.mockReset();
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: {
        getItem: vi.fn(),
      },
    });
  });

  it("prefers a current Supabase access token for Vercel protected requests", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "supabase-access-token" } }, error: null });

    await expect(getJarvisAuthorizationHeader()).resolves.toBe("Bearer supabase-access-token");
  });

  it("retains the managed preview bearer fallback when no Supabase session exists", async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    vi.mocked(sessionStorage.getItem).mockReturnValue("app_session_id=managed-token; path=/");

    await expect(getJarvisAuthorizationHeader()).resolves.toBe("Bearer managed-token");
  });
});
