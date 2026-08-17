import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Vercel production routing", () => {
  it("routes API requests to the serverless catch-all before serving the Vite client", () => {
    const config = JSON.parse(
      readFileSync(resolve(process.cwd(), "vercel.json"), "utf8"),
    ) as {
      rewrites?: Array<{ source: string; destination: string }>;
    };

    expect(config.rewrites).toEqual([
      {
        source: "/api/(.*)",
        destination: "/api/[...path]",
      },
      {
        source: "/(.*)",
        destination: "/index.html",
      },
    ]);
  });
});
