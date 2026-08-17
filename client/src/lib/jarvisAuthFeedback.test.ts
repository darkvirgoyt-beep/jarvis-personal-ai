import { describe, expect, it } from "vitest";
import { describeJarvisAuthError, validateJarvisCredentials } from "./jarvisAuthFeedback";

describe("Jarvis email authentication feedback", () => {
  it("validates email syntax and signup password length before a Supabase request", () => {
    expect(validateJarvisCredentials("not-an-email", "correct-horse", "sign-in")).toMatch(/valid email/i);
    expect(validateJarvisCredentials("jarvis@example.com", "123", "sign-up")).toMatch(/at least 6/i);
    expect(validateJarvisCredentials("jarvis@example.com", "correct-horse", "sign-up")).toBeNull();
  });

  it("explains an existing-account sign-in failure without exposing account enumeration details", () => {
    expect(describeJarvisAuthError(new Error("Invalid login credentials"), "sign-in")).toMatch(/confirm.*inbox/i);
  });

  it("turns the Supabase provider-disabled error into an actionable message", () => {
    expect(describeJarvisAuthError(new Error("Unsupported provider: provider is not enabled"), "google")).toMatch(/Google sign-in is not configured yet/i);
  });
});
