import { describe, expect, it } from "vitest";
import { buildJarvisExternalAction } from "./jarvisExternalActions";

describe("Jarvis external action preparation", () => {
  it("builds encoded safe web and map destinations without navigation side effects", () => {
    expect(buildJarvisExternalAction("search", "best cafés near me").url).toContain("best%20caf%C3%A9s%20near%20me");
    expect(buildJarvisExternalAction("directions", "Mumbai Airport").url).toBe("https://www.google.com/maps/dir/?api=1&destination=Mumbai%20Airport");
  });

  it("uses handoff schemes only after normalizing phone input and rejects unsafe profile text", () => {
    expect(buildJarvisExternalAction("whatsapp", "+91 98765 43210 | Hello from Jarvis").url).toContain("https://wa.me/919876543210?text=Hello%20from%20Jarvis");
    expect(() => buildJarvisExternalAction("instagram", "https://instagram.com/not-a-handle")).toThrow("valid Instagram username");
  });
});
