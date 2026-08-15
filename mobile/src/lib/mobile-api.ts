import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const SESSION_KEY = "jarvis_mobile_session";
const API_BASE_URL = process.env.EXPO_PUBLIC_JARVIS_API_BASE_URL ?? "https://jarvisai-tyjkhyjq.manus.space";

export async function loadMobileSession() {
  return SecureStore.getItemAsync(SESSION_KEY);
}

export async function saveMobileSession(token: string) {
  return SecureStore.setItemAsync(SESSION_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function clearMobileSession() {
  return SecureStore.deleteItemAsync(SESSION_KEY);
}

export async function streamJarvisMobileResponse(input: {
  token: string;
  content: string;
  agent?: string;
  onDelta: (text: string) => void;
}) {
  const response = await fetch(`${API_BASE_URL}/api/jarvis/stream`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${input.token}`,
    },
    body: JSON.stringify({ content: input.content, agent: input.agent ?? "general" }),
  });
  if (!response.ok || !response.body) throw new Error("Jarvis is unavailable. Check your connection and sign-in state.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const payload = frame.split("\n").find(line => line.startsWith("data: "))?.slice(6);
      if (!payload) continue;
      const event = JSON.parse(payload) as { type?: string; delta?: string; error?: string };
      if (event.type === "delta" && event.delta) input.onDelta(event.delta);
      if (event.type === "error") throw new Error(event.error ?? "Jarvis could not complete this request.");
    }
  }
}

const toBase64Url = (value: string) => value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export async function createMobilePairingRequest() {
  const verifier = toBase64Url(Crypto.getRandomBytes(48).reduce((value, byte) => value + String.fromCharCode(byte), ""));
  const codeChallenge = toBase64Url(await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, { encoding: Crypto.CryptoEncoding.BASE64 }));
  const url = `${API_BASE_URL}/api/jarvis/mobile/pair?redirectUri=${encodeURIComponent("jarvis://auth")}&codeChallenge=${encodeURIComponent(codeChallenge)}`;
  return { verifier, url };
}

export async function exchangeMobilePairingCode(code: string, codeVerifier: string) {
  const response = await fetch(`${API_BASE_URL}/api/jarvis/mobile/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code, codeVerifier }),
  });
  const payload = await response.json() as { sessionToken?: string; error?: string };
  if (!response.ok || !payload.sessionToken) throw new Error(payload.error ?? "Mobile pairing could not be completed.");
  return payload.sessionToken;
}
