import type { JarvisAgent } from "./jarvisPolicies";

export function buildJarvisBasicFallback(content: string, agent: JarvisAgent) {
  const normalized = content.replace(/\s+/g, " ").trim();
  const buildRequest = agent === "coding" || /\b(build|website|web app|application|frontend|backend|api|database|code)\b/i.test(normalized);
  if (buildRequest) {
    return [
      "Jarvis basic response mode is active. The primary AI provider and managed model fallback are unavailable, so I cannot generate a full live code response right now.",
      "I can still help you prepare a free local build brief: define the product goal, choose a website or full-stack application, decide whether API, database, authentication, or storage are needed, then review the compile-readiness checklist in Builder.",
      "No code, files, migrations, integrations, or deployments were run. When a provider is available again, send the approved Builder brief to the Coding agent for a reviewable implementation plan.",
    ].join("\n\n");
  }
  return [
    "Jarvis basic response mode is active. The primary AI provider and managed model fallback are unavailable.",
    `Your request was received: “${normalized.slice(0, 420)}”. I can preserve your request in this private conversation and help you organize it into a task, memory, or Builder brief while advanced generation is unavailable.`,
    "No external service, device, file, code, message, or action was accessed or executed.",
  ].join("\n\n");
}
