import { build } from "esbuild";

await build({
  entryPoints: ["server/app.ts"],
  bundle: true,
  format: "cjs",
  outfile: "api/_jarvis-app.cjs",
  platform: "node",
  target: "node20",
});
