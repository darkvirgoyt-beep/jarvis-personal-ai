import { describe, expect, it, vi } from "vitest";
import { beginJarvisPasswordReset, getJarvisPasswordResetReturnUrl } from "./jarvisRecovery";

describe("Jarvis password recovery", () => {
  it("returns recovery links to the deployed Jarvis origin instead of localhost", () => {
    expect(getJarvisPasswordResetReturnUrl("https://scrimly-seven.vercel.app/")).toBe(
      "https://scrimly-seven.vercel.app/reset-password",
    );
  });

  it("requests the reset email with the Vercel-safe recovery return URL", async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });
    const client = { auth: { resetPasswordForEmail } } as never;

    await beginJarvisPasswordReset(client, " owner@example.com ", "https://scrimly-seven.vercel.app");

    expect(resetPasswordForEmail).toHaveBeenCalledWith("owner@example.com", {
      redirectTo: "https://scrimly-seven.vercel.app/reset-password",
    });
  });
});
