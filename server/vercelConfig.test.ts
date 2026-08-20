import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("Vercel deployment contract", () => {
  it("bundles the shared server application and exposes a catch-all API Function without committing secrets", () => {
    const config = JSON.parse(readFileSync(resolve(root, "vercel.json"), "utf8"));
    const functionSource = readFileSync(resolve(root, "api", "[...path].ts"), "utf8");
    const buildSource = readFileSync(resolve(root, "scripts", "build-vercel-api.mjs"), "utf8");

    expect(config.buildCommand).toBe("pnpm run build:vercel");
    expect(config.outputDirectory).toBe("dist/public");
    expect(config.functions["api/[...path].ts"].includeFiles).toBe("api/_jarvis-app.cjs");
    expect(JSON.stringify(config)).not.toMatch(/(OPENROUTER_API_KEY|DATABASE_URL|JWT_SECRET)/);
    expect(functionSource).toContain("_jarvis-app.cjs");
    expect(buildSource).toContain('entryPoints: ["server/app.ts"]');
    expect(buildSource).toContain('outfile: "api/_jarvis-app.cjs"');
    expect(functionSource).not.toMatch(/listen\s*\(/);
  });

  it("keeps development-only JSX tooling and unsafe manual vendor chunks out of the production client build", () => {
    const viteSource = readFileSync(resolve(root, "vite.config.ts"), "utf8");

    expect(viteSource).toContain("...(isProductionBuild ? [] : [jsxLocPlugin()])");
    expect(viteSource).toContain("reportCompressedSize: false");
    expect(viteSource).not.toContain("manualChunks");
  });

  it("preserves the documented VirgoYT workspace URL alongside the original agent route", () => {
    const appSource = readFileSync(resolve(root, "client", "src", "App.tsx"), "utf8");

    expect(appSource).toContain('<Route path={"/agent"} component={VirgoYTAgent} />');
    expect(appSource).toContain('<Route path={"/virgoyt"} component={VirgoYTAgent} />');
  });
});
