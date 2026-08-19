import type { Request } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";

const now = "2026-08-17T00:00:00.000Z";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.doUnmock("@supabase/supabase-js");
  vi.doUnmock("./_core/sdk");
  vi.doUnmock("./db");
});

describe("authenticateJarvisRequest", () => {
  it("verifies a Supabase bearer token server-side and maps the UUID to a cloud Jarvis profile", async () => {
    vi.stubEnv("SUPABASE_URL", "https://jarvis-auth.example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "server-only-role-key");
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: "c2d5bdb5-a283-4c1f-ab01-5b1ad66d7ee5", email: "jarvis@example.com", user_metadata: { full_name: "Jarvis Owner" } } },
      error: null,
    });
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 73,
        open_id: "c2d5bdb5-a283-4c1f-ab01-5b1ad66d7ee5",
        name: "Jarvis Owner",
        email: "jarvis@example.com",
        login_method: "supabase",
        role: "user",
        created_at: now,
        updated_at: now,
        last_signed_in: now,
      },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ single });
    const upsert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ upsert });
    const managedAuthenticate = vi.fn().mockRejectedValue(new Error("Invalid session cookie"));

    vi.doMock("@supabase/supabase-js", () => ({ createClient: vi.fn(() => ({ auth: { getUser }, from })) }));
    vi.doMock("./_core/sdk", () => ({ sdk: { authenticateRequest: managedAuthenticate } }));
    vi.doMock("./db", () => ({ getDb: vi.fn().mockResolvedValue(null) }));

    const { authenticateJarvisRequest } = await import("./_core/authentication");
    const result = await authenticateJarvisRequest({ header: vi.fn().mockReturnValue("Bearer verified-access-token") } as unknown as Request);

    expect(getUser).toHaveBeenCalledWith("verified-access-token");
    expect(from).toHaveBeenCalledWith("jarvis_users");
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      open_id: "c2d5bdb5-a283-4c1f-ab01-5b1ad66d7ee5",
      login_method: "supabase",
    }), { onConflict: "open_id" });
    expect(result).toMatchObject({ id: 73, openId: "c2d5bdb5-a283-4c1f-ab01-5b1ad66d7ee5", email: "jarvis@example.com" });
  });

  it("falls back to the cloud profile table when the configured local database is unreachable", async () => {
    vi.stubEnv("SUPABASE_URL", "https://jarvis-auth.example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "server-only-role-key");
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: "c2d5bdb5-a283-4c1f-ab01-5b1ad66d7ee5", email: "jarvis@example.com", user_metadata: { full_name: "Jarvis Owner" } } },
      error: null,
    });
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 74,
        open_id: "c2d5bdb5-a283-4c1f-ab01-5b1ad66d7ee5",
        name: "Jarvis Owner",
        email: "jarvis@example.com",
        login_method: "supabase",
        role: "user",
        created_at: now,
        updated_at: now,
        last_signed_in: now,
      },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ single });
    const upsert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ upsert });
    const managedAuthenticate = vi.fn().mockRejectedValue(new Error("Invalid session cookie"));

    vi.doMock("@supabase/supabase-js", () => ({ createClient: vi.fn(() => ({ auth: { getUser }, from })) }));
    vi.doMock("./_core/sdk", () => ({ sdk: { authenticateRequest: managedAuthenticate } }));
    vi.doMock("./db", () => ({
      getDb: vi.fn().mockResolvedValue({ unreachable: true }),
      upsertUser: vi.fn().mockRejectedValue(new Error("Local database is unreachable")),
      getUserByOpenId: vi.fn(),
    }));

    const { authenticateJarvisRequest } = await import("./_core/authentication");
    const result = await authenticateJarvisRequest({ header: vi.fn().mockReturnValue("Bearer verified-access-token") } as unknown as Request);

    expect(from).toHaveBeenCalledWith("jarvis_users");
    expect(result).toMatchObject({ id: 74, openId: "c2d5bdb5-a283-4c1f-ab01-5b1ad66d7ee5" });
  });

  it("skips legacy MySQL mapping for a verified Supabase session on Vercel", async () => {
    vi.stubEnv("SUPABASE_URL", "https://jarvis-auth.example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "server-only-role-key");
    vi.stubEnv("VERCEL", "1");
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: "c2d5bdb5-a283-4c1f-ab01-5b1ad66d7ee5", email: "jarvis@example.com", user_metadata: {} } },
      error: null,
    });
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 75,
        open_id: "c2d5bdb5-a283-4c1f-ab01-5b1ad66d7ee5",
        name: "jarvis",
        email: "jarvis@example.com",
        login_method: "supabase",
        role: "user",
        created_at: now,
        updated_at: now,
        last_signed_in: now,
      },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ single });
    const from = vi.fn().mockReturnValue({ upsert: vi.fn().mockReturnValue({ select }) });
    const getDb = vi.fn().mockResolvedValue({ legacy: true });

    vi.doMock("@supabase/supabase-js", () => ({ createClient: vi.fn(() => ({ auth: { getUser }, from })) }));
    vi.doMock("./_core/sdk", () => ({ sdk: { authenticateRequest: vi.fn().mockRejectedValue(new Error("Invalid session cookie")) } }));
    vi.doMock("./db", () => ({ getDb, upsertUser: vi.fn(), getUserByOpenId: vi.fn() }));

    const { authenticateJarvisRequest } = await import("./_core/authentication");
    await expect(authenticateJarvisRequest({ header: vi.fn().mockReturnValue("Bearer verified-access-token") } as unknown as Request))
      .resolves.toMatchObject({ id: 75, openId: "c2d5bdb5-a283-4c1f-ab01-5b1ad66d7ee5" });

    expect(getDb).not.toHaveBeenCalled();
    expect(from).toHaveBeenCalledWith("jarvis_users");
  });

  it("preserves a valid managed OAuth session without consulting Supabase", async () => {
    vi.stubEnv("SUPABASE_URL", "https://jarvis-auth.example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "server-only-role-key");
    const managedUser = { id: 42, openId: "managed-user", name: "Managed Owner", email: null, loginMethod: null, role: "user", createdAt: new Date(now), updatedAt: new Date(now), lastSignedIn: new Date(now) };
    const getUser = vi.fn();

    vi.doMock("@supabase/supabase-js", () => ({ createClient: vi.fn(() => ({ auth: { getUser } })) }));
    vi.doMock("./_core/sdk", () => ({ sdk: { authenticateRequest: vi.fn().mockResolvedValue(managedUser) } }));
    vi.doMock("./db", () => ({ getDb: vi.fn() }));

    const { authenticateJarvisRequest } = await import("./_core/authentication");
    await expect(authenticateJarvisRequest({ header: vi.fn() } as unknown as Request)).resolves.toEqual(managedUser);
    expect(getUser).not.toHaveBeenCalled();
  });
});
