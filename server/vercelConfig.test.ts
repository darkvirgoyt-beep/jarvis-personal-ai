import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("Vercel deployment contract", () => {
  it("builds the client separately and exposes a catch-all API Function without committing secrets", () => {
    const config = JSON.parse(readFileSync(resolve(root, "vercel.json"), "utf8"));
    const functionSource = readFileSync(resolve(root, "api", "[...path].ts"), "utf8");

    expect(config.buildCommand).toBe("pnpm run build:vercel");
    expect(config.outputDirectory).toBe("dist/public");
    expect(JSON.stringify(config)).not.toMatch(/(OPENROUTER_API_KEY|DATABASE_URL|JWT_SECRET)/);
    expect(functionSource).toContain("createJarvisApp");
    expect(functionSource).not.toMatch(/listen\s*\(/);
  });
});
