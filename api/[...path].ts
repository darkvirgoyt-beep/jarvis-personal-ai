import "dotenv/config";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createJarvisApp } = require("./_jarvis-app.cjs") as typeof import("../server/app");

/**
 * Vercel Node Function entry point for all authenticated Jarvis API routes.
 * Static client files are emitted separately to dist/public by Vite.
 */
export default createJarvisApp();
