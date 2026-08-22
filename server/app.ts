import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";
import { createContext } from "./_core/context";
import { registerJarvisStream, registerJarvisVoice } from "./jarvisStream";
import { registerJarvisMobilePairing } from "./jarvisMobile";
import { registerVirgoYTRunnerApi } from "./virgoytRunner";
import { appRouter } from "./routers";

/**
 * Creates the server-backed Jarvis API without binding a port. This lets the
 * local development entry point and Vercel's Node Function use exactly the
 * same authenticated routes.
 */
export function createJarvisApp() {
  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerJarvisStream(app);
  app.use(
    "/api/jarvis/transcribe",
    express.raw({ type: ["audio/*", "application/octet-stream"], limit: "16mb" }),
  );
  registerJarvisVoice(app);
  registerJarvisMobilePairing(app);
  registerVirgoYTRunnerApi(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}
