import { afterEach, describe, expect, it } from "vitest";
import { decryptVirgoYTProviderCredential, encryptVirgoYTProviderCredential, isVirgoYTCredentialVaultConfigured } from "./virgoytCredentialVault";

const originalKey = process.env.VIRGOYT_CREDENTIAL_ENCRYPTION_KEY;
const testKey = Buffer.alloc(32, 7).toString("base64");

afterEach(() => {
  if (originalKey === undefined) delete process.env.VIRGOYT_CREDENTIAL_ENCRYPTION_KEY;
  else process.env.VIRGOYT_CREDENTIAL_ENCRYPTION_KEY = originalKey;
});

describe("VirgoYT credential vault", () => {
  it("encrypts and decrypts a provider key without embedding plaintext in the envelope", () => {
    process.env.VIRGOYT_CREDENTIAL_ENCRYPTION_KEY = testKey;
    const { envelope, credentialRef } = encryptVirgoYTProviderCredential("sk-example-provider-key-which-is-long-enough");

    expect(envelope).not.toContain("sk-example-provider-key");
    expect(credentialRef).toMatch(/^vault:[a-f0-9]{32}$/);
    expect(decryptVirgoYTProviderCredential(envelope)).toBe("sk-example-provider-key-which-is-long-enough");
  });

  it("fails closed when the required server encryption key is absent", () => {
    delete process.env.VIRGOYT_CREDENTIAL_ENCRYPTION_KEY;
    expect(isVirgoYTCredentialVaultConfigured()).toBe(false);
    expect(() => encryptVirgoYTProviderCredential("sk-example-provider-key-which-is-long-enough")).toThrow("not configured");
  });
});
