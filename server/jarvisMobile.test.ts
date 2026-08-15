import { describe, expect, it } from "vitest";
import {
  buildMobileCallbackUrl,
  isAllowedMobileCallback,
  isValidMobileCodeChallenge,
  JARVIS_MOBILE_CALLBACK_URI,
  sha256,
} from "./jarvisMobile";

describe("Jarvis mobile pairing boundary", () => {
  it("accepts only the registered Jarvis mobile callback URI", () => {
    expect(isAllowedMobileCallback(JARVIS_MOBILE_CALLBACK_URI)).toBe(true);
    expect(isAllowedMobileCallback("https://example.com/callback")).toBe(false);
    expect(isAllowedMobileCallback("jarvis://auth/extra")).toBe(false);
  });

  it("encodes only the opaque pairing code in the registered callback", () => {
    expect(buildMobileCallbackUrl("a code&value")).toBe(
      "jarvis://auth?code=a%20code%26value"
    );
  });

  it("requires a verifier challenge that matches the exchange hash", () => {
    const verifier = "v".repeat(43);
    expect(isValidMobileCodeChallenge(sha256(verifier))).toBe(true);
    expect(isValidMobileCodeChallenge("short")).toBe(false);
  });
});
