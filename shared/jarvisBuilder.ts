export const JARVIS_BUILDER_PROJECT_TYPES = ["website", "web_app"] as const;
export const JARVIS_BUILDER_CAPABILITIES = ["api", "database", "authentication", "storage"] as const;

export type JarvisBuilderProjectType = (typeof JARVIS_BUILDER_PROJECT_TYPES)[number];
export type JarvisBuilderCapability = (typeof JARVIS_BUILDER_CAPABILITIES)[number];

export type JarvisBuilderInput = {
  name: string;
  brief: string;
  projectType: JarvisBuilderProjectType;
  capabilities: JarvisBuilderCapability[];
};

export type JarvisBuilderPlan = {
  name: string;
  slug: string;
  projectType: JarvisBuilderProjectType;
  capabilities: JarvisBuilderCapability[];
  recommendedFiles: string[];
  readinessChecks: string[];
  blueprint: string;
  generationPrompt: string;
};

function toSlug(value: string) {
  const slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug.slice(0, 48) || "jarvis-project";
}

function capabilityLabel(capability: JarvisBuilderCapability) {
  return {
    api: "Server API routes and validation",
    database: "Private database schema and user-scoped access",
    authentication: "Authenticated user sessions and authorization checks",
    storage: "Private object storage for uploaded files",
  }[capability];
}

export function createJarvisBuilderPlan(input: JarvisBuilderInput): JarvisBuilderPlan {
  const name = input.name.trim() || "Untitled Jarvis project";
  const brief = input.brief.trim() || "A responsive project prepared through Jarvis Builder.";
  const capabilities = Array.from(new Set(input.capabilities));
  const recommendedFiles = input.projectType === "website"
    ? ["client/src/pages/Home.tsx", "client/src/components/", "client/src/index.css", "client/src/App.tsx"]
    : ["client/src/pages/Home.tsx", "client/src/components/", "client/src/lib/trpc.ts", "server/routers/", "server/db.ts", "drizzle/schema.ts"];

  if (capabilities.includes("api")) recommendedFiles.push("server/routers/project.ts", "server/db.ts");
  if (capabilities.includes("database")) recommendedFiles.push("drizzle/schema.ts", "drizzle/migrations/");
  if (capabilities.includes("storage")) recommendedFiles.push("server/storage.ts");
  const uniqueFiles = Array.from(new Set(recommendedFiles));
  const readinessChecks = [
    "Product brief and primary user flow are defined",
    "Responsive desktop and phone layout is planned",
    "No generated code will be executed, deployed, or connected to services without review",
    ...capabilities.map(capabilityLabel),
  ];
  const capabilitySummary = capabilities.length ? capabilities.map(capabilityLabel).join("; ") : "Responsive frontend only";
  const slug = toSlug(name);
  const blueprint = [
    `# ${name}`,
    "",
    "## Jarvis Builder brief",
    brief,
    "",
    "## Delivery shape",
    `- Project type: ${input.projectType === "website" ? "Responsive website" : "Full-stack web application"}`,
    `- Requested capabilities: ${capabilitySummary}`,
    "- Safety boundary: review generated code, configuration, secrets, migrations, and deployment before execution.",
    "",
    "## Suggested structure",
    ...uniqueFiles.map((file) => `- \`${file}\``),
    "",
    "## Compile-readiness checks",
    ...readinessChecks.map((check) => `- [ ] ${check}`),
  ].join("\n");
  const generationPrompt = [
    `Use Jarvis Builder to design a ${input.projectType === "website" ? "responsive website" : "full-stack web application"} named "${name}".`,
    `Product brief: ${brief}`,
    `Capabilities: ${capabilitySummary}.`,
    "Respond with these exact sections: Product architecture, Screen map, Frontend components, Backend contract, Data model, File plan, Compile-readiness checklist, Tests, and Risks.",
    "Provide reviewable code scaffolding only. Do not claim to run code, create files, apply migrations, connect services, or deploy anything.",
  ].join("\n\n");

  return { name, slug, projectType: input.projectType, capabilities, recommendedFiles: uniqueFiles, readinessChecks, blueprint, generationPrompt };
}
