import type { Express } from "express";
import { createHash, randomBytes } from "node:crypto";
import { createJarvisMobilePairing, consumeJarvisMobilePairing } from "./db";
import { sdk } from "./_core/sdk";

export const JARVIS_MOBILE_CALLBACK_URI = "jarvis://auth";
const MOBILE_SESSION_DURATION_MS = 1000 * 60 * 60 * 24;
const MOBILE_PAIRING_DURATION_MS = 1000 * 60 * 5;

export function isAllowedMobileCallback(value: unknown): value is typeof JARVIS_MOBILE_CALLBACK_URI {
  return value === JARVIS_MOBILE_CALLBACK_URI;
}

export function isValidMobileCodeChallenge(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43,128}$/.test(value);
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function buildMobileCallbackUrl(pairingCode: string): string {
  return `${JARVIS_MOBILE_CALLBACK_URI}?code=${encodeURIComponent(pairingCode)}`;
}

/**
 * Exchanges an authenticated browser session for a one-time pairing code. The
 * Android app proves possession of its verifier on a separate POST before a
 * bearer is issued, avoiding bearer delivery through the custom URI.
 */
export function registerJarvisMobilePairing(app: Express) {
  app.get("/api/jarvis/mobile/pair", async (req, res) => {
    const callback = req.query.redirectUri;
    const codeChallenge = req.query.codeChallenge;
    if (!isAllowedMobileCallback(callback) || !isValidMobileCodeChallenge(codeChallenge)) {
      res.status(400).json({ error: "Unsupported mobile callback." });
      return;
    }

    try {
      const user = await sdk.authenticateRequest(req);
      const pairingCode = randomBytes(32).toString("base64url");
      await createJarvisMobilePairing({
        codeHash: sha256(pairingCode),
        verifierHash: codeChallenge,
        userOpenId: user.openId,
        expiresAt: new Date(Date.now() + MOBILE_PAIRING_DURATION_MS),
      });
      res.redirect(302, buildMobileCallbackUrl(pairingCode));
    } catch {
      res.status(401).json({
        error: "Sign in to Jarvis in this browser before linking the companion.",
      });
    }
  });

  app.post("/api/jarvis/mobile/token", async (req, res) => {
    const code = typeof req.body?.code === "string" ? req.body.code : "";
    const verifier = typeof req.body?.codeVerifier === "string" ? req.body.codeVerifier : "";
    if (!code || verifier.length < 43 || verifier.length > 128) {
      res.status(400).json({ error: "Invalid mobile pairing exchange." });
      return;
    }
    try {
      const userOpenId = await consumeJarvisMobilePairing({
        codeHash: sha256(code),
        verifierHash: sha256(verifier),
      });
      if (!userOpenId) {
        res.status(401).json({ error: "This mobile pairing code is expired, already used, or invalid." });
        return;
      }
      const sessionToken = await sdk.createSessionToken(userOpenId, {
        expiresInMs: MOBILE_SESSION_DURATION_MS,
        name: "Jarvis mobile",
      });
      res.status(200).json({ sessionToken });
    } catch {
      res.status(503).json({ error: "Jarvis pairing is temporarily unavailable." });
    }
  });
}
