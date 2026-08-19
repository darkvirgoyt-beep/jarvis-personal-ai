#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const TOOL_KINDS = new Set(["file_write", "file_delete", "terminal_command", "browser_navigate", "git_operation", "deployment", "runner_connect"]);
const HELP = `VirgoYT runner foundation (proposal-only)

Commands:
  virgoyt init --server https://jarvis.example --project <id> --name <runner name>
  virgoyt status [--config .virgoyt/runner.json]
  virgoyt proposal --kind <tool kind> --title <visible title> [--details <details>]
  virgoyt doctor

This CLI never receives API keys, passwords, browser cookies, or approval tokens.
It does not execute commands, navigate browsers, modify files, or connect to a server.
`;

function args(values) {
  const result = new Map();
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) continue;
    const key = value.slice(2);
    const next = values[index + 1];
    if (!next || next.startsWith("--")) throw new Error(`Missing value for --${key}`);
    result.set(key, next);
    index += 1;
  }
  if (result.has("token") || result.has("api-key") || result.has("password")) {
    throw new Error("VirgoYT runner setup never accepts credentials on the command line.");
  }
  return result;
}

function value(options, key) {
  const found = options.get(key)?.trim();
  if (!found) throw new Error(`--${key} is required`);
  return found;
}

function configPath(options) {
  return resolve(options.get("config") || ".virgoyt/runner.json");
}

function readConfig(options) {
  const path = configPath(options);
  if (!existsSync(path)) throw new Error(`Runner configuration was not found at ${path}. Run 'virgoyt init' first.`);
  return { path, config: JSON.parse(readFileSync(path, "utf8")) };
}

function runDoctor() {
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  const tools = ["git", "docker"].map((tool) => {
    try {
      const output = execFileSync(tool, ["--version"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
      return { tool, available: true, output };
    } catch {
      return { tool, available: false, output: "not installed" };
    }
  });
  process.stdout.write(`${JSON.stringify({ node: process.versions.node, nodeSupported: nodeMajor >= 20, tools, mode: "proposal_only" }, null, 2)}\n`);
  process.exitCode = nodeMajor >= 20 ? 0 : 1;
}

function main() {
  const [command = "help", ...raw] = process.argv.slice(2);
  if (["help", "--help", "-h"].includes(command)) return process.stdout.write(HELP);
  if (command === "doctor") return runDoctor();
  const options = args(raw);

  if (command === "init") {
    const server = value(options, "server");
    const parsed = new URL(server);
    if (parsed.protocol !== "https:") throw new Error("--server must use HTTPS.");
    const projectId = Number(value(options, "project"));
    if (!Number.isSafeInteger(projectId) || projectId < 1) throw new Error("--project must be a positive numeric ID.");
    const config = {
      version: 1,
      server: parsed.origin,
      projectId,
      displayName: value(options, "name"),
      mode: "proposal_only",
      createdAt: new Date().toISOString(),
      security: "No credentials, browser state, commands, or approval tokens are stored in this file.",
    };
    const path = configPath(options);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    return process.stdout.write(`Runner configuration saved at ${path}. It cannot execute tools until a future signed pairing adapter is installed.\n`);
  }

  if (command === "status") {
    const { path, config } = readConfig(options);
    return process.stdout.write(`${JSON.stringify({ configPath: path, ...config }, null, 2)}\n`);
  }

  if (command === "proposal") {
    const { path, config } = readConfig(options);
    const kind = value(options, "kind");
    if (!TOOL_KINDS.has(kind)) throw new Error(`Unsupported proposal kind: ${kind}`);
    const proposal = {
      version: 1,
      kind,
      title: value(options, "title"),
      details: options.get("details")?.trim() || null,
      projectId: config.projectId,
      server: config.server,
      status: "draft",
      requiresExplicitApproval: true,
      executionState: "proposal_only",
      createdAt: new Date().toISOString(),
    };
    const output = resolve(dirname(path), "proposals", `${Date.now()}-${kind}.json`);
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, `${JSON.stringify(proposal, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    return process.stdout.write(`Proposal draft saved at ${output}. No action executed.\n`);
  }

  throw new Error(`Unknown command: ${command}\n\n${HELP}`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`VirgoYT: ${error instanceof Error ? error.message : "Unknown error"}\n`);
  process.exitCode = 1;
}
