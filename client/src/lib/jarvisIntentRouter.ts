export type JarvisRouteAgent = "General" | "Coding" | "Research" | "Files" | "System" | "Creative";

export type JarvisRouteIntent = "answer" | "research" | "code" | "builder" | "image" | "data" | "document" | "debug" | "environment";

export type JarvisPromptRoute = {
  intent: JarvisRouteIntent;
  label: string;
  agent: JarvisRouteAgent;
  summary: string;
  executionLine: string;
  needsRunner: boolean;
  runnerProfile?: "ubuntu" | "kali";
};

const routingRules: Array<{ intent: JarvisRouteIntent; pattern: RegExp; route: Omit<JarvisPromptRoute, "intent"> }> = [
  {
    intent: "environment",
    pattern: /\b(kali|ubuntu|linux|terminal|shell|sandbox|virtual computer|virtual pc|docker|ssh|environment|browser session)\b/i,
    route: {
      label: "Environment handoff",
      agent: "System",
      summary: "Map the requested operating environment and prepare a visible, reviewable runner handoff.",
      executionLine: "Drafting runner requirements and environment boundary",
      needsRunner: true,
      runnerProfile: "ubuntu",
    },
  },
  {
    intent: "debug",
    pattern: /\b(debug|bug|error|broken|failing|failure|stack trace|logs?|fix(?:\s+the)?\s+issue|diagnose)\b/i,
    route: {
      label: "Debugging runbook",
      agent: "System",
      summary: "Trace the issue, isolate the smallest safe fix, and prepare evidence before any change.",
      executionLine: "Collecting symptom, reproduction, and verification steps",
      needsRunner: false,
    },
  },
  {
    intent: "builder",
    pattern: /\b(build|create|make|develop|ship)\b.{0,80}\b(app|website|web app|android|apk|mobile app|frontend|backend|api|saas|platform)\b|\b(app|website|web app|android|apk|mobile app|frontend|backend|api|saas|platform)\b.{0,80}\b(build|create|make|develop|ship)\b/i,
    route: {
      label: "App & web build",
      agent: "Coding",
      summary: "Convert the request into a reviewed build brief, architecture, artifacts, and runner requirements.",
      executionLine: "Generating implementation plan, deliverables, and quality gates",
      needsRunner: true,
      runnerProfile: "ubuntu",
    },
  },
  {
    intent: "image",
    pattern: /\b(image|photo|illustration|logo|icon|poster|visual|generate art|design image)\b/i,
    route: {
      label: "Visual brief",
      agent: "Creative",
      summary: "Prepare a production-ready visual brief, prompt, and approved generation workflow.",
      executionLine: "Structuring visual direction and output requirements",
      needsRunner: false,
    },
  },
  {
    intent: "research",
    pattern: /\b(research|find out|investigate|compare|latest|news|sources?|citations?|market)\b/i,
    route: {
      label: "Source-linked research",
      agent: "Research",
      summary: "Frame the question, locate evidence, and return a source-linked research brief.",
      executionLine: "Planning evidence collection and source verification",
      needsRunner: false,
    },
  },
  {
    intent: "data",
    pattern: /\b(data|spreadsheet|csv|excel|calculate|calculation|chart|graph|analysis|statistics?)\b/i,
    route: {
      label: "Data analysis",
      agent: "Research",
      summary: "Prepare an auditable analysis, calculations, tables, and export-ready artifact plan.",
      executionLine: "Mapping data inputs, calculations, and visual outputs",
      needsRunner: false,
    },
  },
  {
    intent: "document",
    pattern: /\b(pdf|document|report|resume|proposal|presentation|slides|write a)\b/i,
    route: {
      label: "Artifact creation",
      agent: "Files",
      summary: "Shape a reviewed document or export-ready artifact with clear deliverables.",
      executionLine: "Outlining artifact structure and review checkpoints",
      needsRunner: false,
    },
  },
  {
    intent: "code",
    pattern: /\b(code|function|typescript|javascript|python|react|css|html|database schema|sql|algorithm)\b/i,
    route: {
      label: "Code & implementation",
      agent: "Coding",
      summary: "Produce reviewed implementation details, tests, and integration guidance.",
      executionLine: "Designing implementation and verification steps",
      needsRunner: false,
    },
  },
];

export function routeJarvisPrompt(content: string): JarvisPromptRoute {
  const normalized = content.trim();
  const visualRule = routingRules.find((rule) => rule.intent === "image");
  const matched = visualRule?.pattern.test(normalized) ? visualRule : routingRules.find((rule) => rule.pattern.test(normalized));
  if (!matched) {
    return {
      intent: "answer",
      label: "General assistance",
      agent: "General",
      summary: "Interpret the request, answer directly, and surface any useful reviewed next steps.",
      executionLine: "Understanding outcome and constraints",
      needsRunner: false,
    };
  }

  const runnerProfile = /\bkali\b/i.test(normalized) ? "kali" : matched.route.runnerProfile;
  return { intent: matched.intent, ...matched.route, runnerProfile };
}
