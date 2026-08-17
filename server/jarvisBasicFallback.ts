import type { JarvisAgent } from "./jarvisPolicies";

export function buildJarvisBasicFallback(content: string, agent: JarvisAgent) {
  const normalized = content.replace(/\s+/g, " ").trim();
  const buildRequest = agent === "coding" || /\b(build|website|web app|application|frontend|backend|api|database|code)\b/i.test(normalized);
  if (buildRequest) {
    return [
      "Jarvis workspace assistance mode is active. The primary AI provider and managed model fallback are unavailable, so I cannot generate a full live code response right now.",
      "Your private Builder is still available: capture the product goal, choose a website or full-stack application, select API, database, authentication, or storage needs, and review the compile-readiness plan before implementation.",
      "Jarvis also has an active approval-gated private workspace for files, folders, and code proposals. A persistent Cloud Computer is not connected, so I will not claim that I can run, compile, install, or browse on a virtual desktop in this session.",
      "No code, files, migrations, integrations, or deployments were run. When a provider is available again, send the approved Builder brief to the Coding agent for a reviewable implementation plan.",
    ].join("\n\n");
  }
  return [
    "Jarvis workspace assistance mode is active. The primary AI provider and managed model fallback are unavailable.",
    `Your request was received: “${normalized.slice(0, 420)}”. I can preserve your request in this private conversation and help you organize it into a task, memory, or Builder brief while advanced generation is unavailable.`,
    "Your browser-based private workspace and Builder remain available for approval-gated planning and file proposals. A persistent Cloud Computer is not connected, so Jarvis will not claim it can run software or control a virtual desktop.",
    "No external service, device, file, code, message, or action was accessed or executed.",
  ].join("\n\n");
}
