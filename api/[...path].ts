import "dotenv/config";
import { createJarvisApp } from "../server/app";

/**
 * Vercel Node Function entry point for all authenticated Jarvis API routes.
 * Static client files are emitted separately to dist/public by Vite.
 */
export default createJarvisApp();
