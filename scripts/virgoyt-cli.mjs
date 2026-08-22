#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";

const TOOL_CONTRACTS = Object.freeze({
  file_write: { riskLevel: "medium", summary: "Proposes a file creation or modification." },
  file_delete: { riskLevel: "high", summary: "Proposes deletion of a file or directory." },
  terminal_command: { riskLevel: "high", summary: "Proposes a terminal command for explicit review." },
  browser_navigate: { riskLevel: "medium", summary: "Proposes navigation to a reviewed browser destination." },
  git_operation: { riskLevel: "high", summary: "Proposes a Git operation for explicit review." },
  deployment: { riskLevel: "high", summary: "Proposes a deployment operation for explicit review." },
  runner_connect: { riskLevel: "high", summary: "Proposes pairing a runner without establishing a connection." },
});

function usage() {
  return `VirgoYT runner\n\nUsage:\n  node scripts/virgoyt-cli.mjs status\n  node scripts/virgoyt-cli.mjs proposal --project <id> --kind <tool-kind> --title <title> --details <details>\n  node scripts/virgoyt-cli.mjs pair --api-url <url> --runner-id <id> --token <one-time-token>\n  node scripts/virgoyt-cli.mjs work --api-url <url> --runner-id <id> --token <pairing-token> --workspace-root <dir>\n\nA paired worker executes only a server-issued fixed compile recipe after workspace approval. It never accepts a chat command, arbitrary shell string, signing key, store credential, or publishing request.`;
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) throw new Error(`Missing value for --${key}`);
    values[key] = next;
    index += 1;
  }
  return values;
}

function redact(value) {
  return value
    .replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, "[REDACTED_API_KEY]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+\-/=]{12,}\b/gi, "Bearer [REDACTED]")
    .replace(/\b(api[_ -]?key|password|secret|token)\s*[:=]\s*\S+/gi, "$1=[REDACTED]");
}

function fail(message) {
  process.stderr.write(`${message}\n\n${usage()}\n`);
  return 2;
}

function runnerEndpoint(apiUrl, suffix) {
  return `${apiUrl.replace(/\/$/, "")}/api/virgoyt/runner${suffix}`;
}

async function runnerRequest(input, suffix, method = "POST", body) {
  const response = await fetch(runnerEndpoint(input.apiUrl, suffix), {
    method,
    headers: { authorization: `Bearer ${input.token}`, ...(body ? { "content-type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify({ runnerId: Number(input.runnerId), ...body }) } : {}),
  });
  const value = await response.json().catch(() => ({ ok: false, message: `HTTP ${response.status}` }));
  if (!response.ok || !value.ok) throw new Error(value.message ?? `Runner API request failed (${response.status}).`);
  return value;
}

function safeWorkspace(root, relativePath) {
  const absoluteRoot = resolve(root);
  const workspace = resolve(absoluteRoot, relativePath);
  if (workspace !== absoluteRoot && !workspace.startsWith(`${absoluteRoot}${sep}`)) throw new Error("Rejected workspace path outside --workspace-root.");
  if (!existsSync(workspace)) throw new Error(`Workspace does not exist: ${workspace}`);
  return workspace;
}

function runFixed(command, args, cwd, transcript) {
  transcript.push(`$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { cwd, encoding: "utf8", timeout: 20 * 60_000, shell: false, env: { ...process.env, CI: "1" } });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  if (output) transcript.push(redact(output).slice(-6000));
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with ${result.status ?? "an unknown status"}.`);
}

function executeFixedCompile(spec, workspaceRoot) {
  if (!spec || spec.kind !== "compile" || spec.version !== 1 || spec.signingAllowed !== false || spec.publishingAllowed !== false) throw new Error("Rejected unsupported compile recipe.");
  const workspace = safeWorkspace(workspaceRoot, spec.workspacePath);
  const transcript = [`Target: ${spec.target}`, `Environment: ${spec.environment}`, `Workspace: ${spec.workspacePath}`];
  if (spec.target === "android") {
    if (!existsSync(resolve(workspace, "gradlew"))) throw new Error("Rejected Android build: gradlew was not found in the approved workspace.");
    runFixed("./gradlew", ["assembleDebug"], workspace, transcript);
  } else {
    if (!existsSync(resolve(workspace, "package.json"))) throw new Error("Rejected Node build: package.json was not found in the approved workspace.");
    runFixed("pnpm", ["install", "--frozen-lockfile"], workspace, transcript);
    runFixed("pnpm", ["test", "--", "--run"], workspace, transcript);
    runFixed("pnpm", ["build"], workspace, transcript);
  }
  return transcript.join("\n");
}

async function pairRunner(input) {
  const result = await runnerRequest(input, "/pair", "POST", {});
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return 0;
}

async function workOnce(input) {
  await runnerRequest(input, "/heartbeat", "POST", {});
  const claim = await runnerRequest(input, `/compile/claim?runnerId=${encodeURIComponent(input.runnerId)}`, "GET");
  if (!claim.job) {
    process.stdout.write("No approved compile job is waiting.\n");
    return 0;
  }
  let success = false;
  let summary = "";
  try {
    summary = executeFixedCompile(claim.job.spec, input.workspaceRoot);
    success = true;
  } catch (error) {
    summary = `${summary}\nCompile failed: ${error instanceof Error ? error.message : "unknown failure"}`.trim();
  }
  await runnerRequest(input, "/compile/report", "POST", { proposalId: claim.job.proposalId, success, summary });
  process.stdout.write(`${success ? "Compile completed." : "Compile failed; result reported."}\n`);
  return success ? 0 : 1;
}

async function main(argv) {
  const command = argv[0] ?? "help";
  if (command === "help" || command === "--help" || command === "-h") {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }
  if (command === "status") {
    process.stdout.write(`${JSON.stringify({
      runner: "virgoyt",
      version: 2,
      mode: "proposal-or-paired-compile-worker",
      credentialAccess: false,
      commandExecution: "fixed-approved-compile-recipes-only",
      signingAllowed: false,
      publishingAllowed: false,
      requiresWorkspaceApproval: true,
      supportedToolKinds: Object.keys(TOOL_CONTRACTS),
    }, null, 2)}\n`);
    return 0;
  }
  let input;
  try { input = parseArgs(argv.slice(1)); } catch (error) { return fail(error instanceof Error ? error.message : "Invalid arguments."); }
  if (command === "pair" || command === "work") {
    if (!input["api-url"] || !input["runner-id"] || !input.token) return fail(`${command} requires --api-url, --runner-id, and --token.`);
    const runnerInput = { apiUrl: input["api-url"], runnerId: input["runner-id"], token: input.token, workspaceRoot: input["workspace-root"] };
    if (command === "pair") return pairRunner(runnerInput);
    if (!runnerInput.workspaceRoot) return fail("work requires --workspace-root.");
    return workOnce(runnerInput);
  }
  if (command !== "proposal") return fail(`Unknown command: ${command}`);
  const projectId = input.project?.trim();
  const toolKind = input.kind?.trim();
  const title = input.title?.trim();
  const details = input.details?.trim();
  if (!projectId || !toolKind || !title || !details) return fail("Proposal requires --project, --kind, --title, and --details.");
  const contract = TOOL_CONTRACTS[toolKind];
  if (!contract) return fail(`Unsupported tool kind: ${toolKind}`);
  const proposal = { version: 1, type: "virgoyt.tool_proposal", projectId, toolKind, riskLevel: contract.riskLevel, requiresApproval: true, executable: false, title: redact(title).slice(0, 240), details: redact(details).slice(0, 12_000), contract: contract.summary };
  proposal.payloadDigest = createHash("sha256").update(JSON.stringify(proposal)).digest("hex");
  process.stdout.write(`${JSON.stringify(proposal, null, 2)}\n`);
  return 0;
}

main(process.argv.slice(2)).then((exitCode) => { process.exitCode = exitCode; }).catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : "Runner failed."}\n`); process.exitCode = 1; });
