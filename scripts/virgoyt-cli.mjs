#!/usr/bin/env node

import { createHash } from "node:crypto";

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
  return `VirgoYT proposal-only runner\n\nUsage:\n  node scripts/virgoyt-cli.mjs status\n  node scripts/virgoyt-cli.mjs proposal --project <id> --kind <tool-kind> --title <title> --details <details>\n\nThis utility never executes commands, opens browsers, reads credentials, calls remote APIs, or applies a proposal. A proposal must be reviewed and approved in the VirgoYT workspace before an independently paired runner may act.`;
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

function main(argv) {
  const command = argv[0] ?? "help";
  if (command === "help" || command === "--help" || command === "-h") {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }

  if (command === "status") {
    process.stdout.write(`${JSON.stringify({
      runner: "virgoyt-proposal-only",
      version: 1,
      mode: "offline",
      externalNetwork: false,
      credentialAccess: false,
      commandExecution: false,
      requiresWorkspaceApproval: true,
      supportedToolKinds: Object.keys(TOOL_CONTRACTS),
    }, null, 2)}\n`);
    return 0;
  }

  if (command === "execute" || command === "connect" || command === "apply") {
    return fail("Refused: this runner is proposal-only and cannot execute, connect, or apply actions.");
  }

  if (command !== "proposal") return fail(`Unknown command: ${command}`);

  let input;
  try {
    input = parseArgs(argv.slice(1));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Invalid arguments.");
  }
  const projectId = input.project?.trim();
  const toolKind = input.kind?.trim();
  const title = input.title?.trim();
  const details = input.details?.trim();
  if (!projectId || !toolKind || !title || !details) return fail("Proposal requires --project, --kind, --title, and --details.");
  const contract = TOOL_CONTRACTS[toolKind];
  if (!contract) return fail(`Unsupported tool kind: ${toolKind}`);

  const safeDetails = redact(details).slice(0, 12_000);
  const proposal = {
    version: 1,
    type: "virgoyt.tool_proposal",
    projectId,
    toolKind,
    riskLevel: contract.riskLevel,
    requiresApproval: true,
    executable: false,
    title: redact(title).slice(0, 240),
    details: safeDetails,
    contract: contract.summary,
  };
  proposal.payloadDigest = createHash("sha256").update(JSON.stringify(proposal)).digest("hex");
  process.stdout.write(`${JSON.stringify(proposal, null, 2)}\n`);
  return 0;
}

process.exitCode = main(process.argv.slice(2));
