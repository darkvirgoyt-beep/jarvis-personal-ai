import { describe, expect, it, vi } from "vitest";
import { beginJarvisOAuthSignIn, getJarvisAuthReturnUrl } from "./jarvisOAuth";

describe("Jarvis OAuth return handling", () => {
  it("keeps the provider return inside the current deployed Jarvis origin", () => {
    expect(getJarvisAuthReturnUrl("https://scrimly-seven.vercel.app/")).toBe(
      "https://scrimly-seven.vercel.app/?auth=complete",
    );
  });

  it("starts GitHub provider sign-in with the Vercel-safe return URL", async () => {
    const signInWithOAuth = vi.fn().mockResolvedValue({ data: { url: "https://provider.example/authorize" }, error: null });
    const client = { auth: { signInWithOAuth } } as never;

    await expect(beginJarvisOAuthSignIn(client, "github", "https://scrimly-seven.vercel.app")).resolves.toBe(
      "https://provider.example/authorize",
    );
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "github",
      options: { redirectTo: "https://scrimly-seven.vercel.app/?auth=complete" },
    });
  });

  it("uses the same hardened return URL for an email-confirmation redirect", () => {
    expect(getJarvisAuthReturnUrl("https://scrimly-seven.vercel.app")).toBe(
      "https://scrimly-seven.vercel.app/?auth=complete",
    );
  });

  it("surfaces a provider error instead of pretending the user signed in", async () => {
    const providerError = new Error("Google is not enabled");
    const client = {
      auth: { signInWithOAuth: vi.fn().mockResolvedValue({ data: { url: null }, error: providerError }) },
    } as never;

    await expect(beginJarvisOAuthSignIn(client, "google", "https://scrimly-seven.vercel.app")).rejects.toThrow(
      "Google is not enabled",
    );
  });
});
