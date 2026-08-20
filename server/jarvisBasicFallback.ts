import type { JarvisAgent } from "./jarvisPolicies";

export function buildJarvisBasicFallback(content: string, agent: JarvisAgent) {
  const normalized = content.replace(/\s+/g, " ").trim();
  const buildRequest = agent === "coding" || /\b(build|website|web app|application|frontend|backend|api|database|code)\b/i.test(normalized);
  if (buildRequest) {
    return [
      "Jarvis app workspace mode is active. The live AI provider is temporarily unavailable, but your app request is still supported through Builder and a reviewable Coding-agent brief.",
      "I can structure the product requirements, choose website or full-stack architecture, identify API, database, authentication, storage, and deployment requirements, and prepare a concrete implementation and publish proposal for your approval.",
      "Jarvis keeps file changes, repository updates, migrations, secrets, and deployment proposals visible and approval-gated. A persistent Cloud Computer is not connected, so I will not pretend to silently run, compile, install, or browse on a virtual desktop in this session.",
      "No code, files, migrations, integrations, or deployments were run automatically. When live generation is available, Jarvis can turn the approved Builder brief into reviewable code and an explicit GitHub or deployment proposal.",
    ].join("\n\n");
  }
  return [
    "Jarvis workspace assistance mode is active. The primary AI provider and managed model fallback are unavailable.",
    `Your request was received: “${normalized.slice(0, 420)}”. I can preserve your request in this private conversation and help you organize it into a task, memory, or Builder brief while advanced generation is unavailable.`,
    "Your browser-based private workspace and Builder remain available for approval-gated planning and file proposals. A persistent Cloud Computer is not connected, so Jarvis will not claim it can run software or control a virtual desktop.",
    "No external service, device, file, code, message, or action was accessed or executed.",
  ].join("\n\n");
}
