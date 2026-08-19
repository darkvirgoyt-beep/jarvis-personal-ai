import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const VAULT_VERSION = "v1";
const ENCRYPTION_ALGORITHM = "aes-256-gcm";

function encryptionKey() {
  const raw = process.env.VIRGOYT_CREDENTIAL_ENCRYPTION_KEY?.trim();
  if (!raw) throw new Error("VirgoYT credential vault is not configured");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("VirgoYT credential vault key must be a base64-encoded 32-byte value");
  return key;
}

export function isVirgoYTCredentialVaultConfigured() {
  try {
    encryptionKey();
    return true;
  } catch {
    return false;
  }
}

/** Encrypts a transient provider key with AES-256-GCM for server-side storage. */
export function encryptVirgoYTProviderCredential(apiKey: string) {
  const normalized = apiKey.trim();
  if (normalized.length < 16 || normalized.length > 4_000) {
    throw new Error("Provider credentials must be between 16 and 4000 characters");
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(normalized, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const envelope = [VAULT_VERSION, iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
  const credentialRef = `vault:${createHash("sha256").update(envelope).digest("hex").slice(0, 32)}`;
  return { envelope, credentialRef };
}

/** Decrypts only inside server-side provider execution code; never expose its return value to tRPC. */
export function decryptVirgoYTProviderCredential(envelope: string) {
  const [version, ivEncoded, tagEncoded, ciphertextEncoded, extra] = envelope.split(".");
  if (version !== VAULT_VERSION || !ivEncoded || !tagEncoded || !ciphertextEncoded || extra) {
    throw new Error("VirgoYT credential envelope is invalid");
  }
  try {
    const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, encryptionKey(), Buffer.from(ivEncoded, "base64url"));
    decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
    const plaintext = Buffer.concat([decipher.update(Buffer.from(ciphertextEncoded, "base64url")), decipher.final()]);
    return plaintext.toString("utf8");
  } catch {
    throw new Error("VirgoYT credential envelope could not be decrypted");
  }
}
