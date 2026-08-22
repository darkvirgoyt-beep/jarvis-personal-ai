import { createHash } from "node:crypto";
import type { Express, Request, Response } from "express";
import { parseVirgoYTCompileSpec } from "../shared/virgoytCompile";
import * as db from "./virgoytDb";

function fingerprintFromRequest(req: Request) {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token || token.length < 32) return undefined;
  return createHash("sha256").update(JSON.stringify({ pairingToken: token })).digest("hex");
}

function runnerIdFromRequest(req: Request) {
  const value = Number(req.body?.runnerId ?? req.query.runnerId);
  return Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

function deny(res: Response, status: number, message: string) {
  return res.status(status).json({ ok: false, message });
}

/**
 * Worker API for the portable VirgoYT compile runner. The bearer secret is a
 * one-time pairing token whose hash alone is retained in the control plane.
 * This API never accepts browser commands or arbitrary shell source.
 */
export function registerVirgoYTRunnerApi(app: Express) {
  app.post("/api/virgoyt/runner/pair", async (req, res) => {
    const runnerId = runnerIdFromRequest(req);
    const fingerprint = fingerprintFromRequest(req);
    if (!runnerId || !fingerprint) return deny(res, 401, "A runner ID and valid pairing token are required.");
    const paired = await db.pairVirgoYTRunner(runnerId, fingerprint);
    if (paired !== 1) return deny(res, 403, "Runner pairing was rejected or is already used.");
    return res.json({ ok: true, runnerId, status: "paired" });
  });

  app.post("/api/virgoyt/runner/heartbeat", async (req, res) => {
    const runnerId = runnerIdFromRequest(req);
    const fingerprint = fingerprintFromRequest(req);
    if (!runnerId || !fingerprint) return deny(res, 401, "Runner authentication is required.");
    const touched = await db.touchVirgoYTRunner(runnerId, fingerprint);
    if (touched !== 1) return deny(res, 403, "Runner is not paired or has been revoked.");
    return res.json({ ok: true, runnerId, status: "active" });
  });

  app.get("/api/virgoyt/runner/compile/claim", async (req, res) => {
    const runnerId = runnerIdFromRequest(req);
    const fingerprint = fingerprintFromRequest(req);
    if (!runnerId || !fingerprint) return deny(res, 401, "Runner authentication is required.");
    const proposal = await db.claimVirgoYTCompileProposal({ runnerId, pairingFingerprint: fingerprint });
    if (!proposal) return res.json({ ok: true, job: null });
    const spec = parseVirgoYTCompileSpec(proposal.payloadJson);
    if (!spec) {
      await db.completeVirgoYTCompileProposal({ runnerId, pairingFingerprint: fingerprint, proposalId: proposal.id, success: false, details: "Rejected malformed compile recipe." });
      return res.json({ ok: true, job: null });
    }
    return res.json({ ok: true, job: { proposalId: proposal.id, spec } });
  });

  app.post("/api/virgoyt/runner/compile/report", async (req, res) => {
    const runnerId = runnerIdFromRequest(req);
    const fingerprint = fingerprintFromRequest(req);
    const proposalId = Number(req.body?.proposalId);
    const success = req.body?.success === true;
    const summary = typeof req.body?.summary === "string" ? req.body.summary.slice(0, 8_000) : "Compile runner reported no summary.";
    if (!runnerId || !fingerprint || !Number.isSafeInteger(proposalId) || proposalId <= 0) return deny(res, 400, "A runner ID, pairing token, proposal ID, and result are required.");
    const proposal = await db.completeVirgoYTCompileProposal({ runnerId, pairingFingerprint: fingerprint, proposalId, success, details: summary });
    if (!proposal) return deny(res, 403, "Compile result was rejected because the claimed job is unavailable.");
    return res.json({ ok: true, proposalId: proposal.id, status: proposal.status });
  });
}
