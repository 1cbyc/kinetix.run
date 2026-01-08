import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { authRoutes } from "./routes/auth";
import { projectRoutes } from "./routes/projects";
import { deploymentRoutes } from "./routes/deployments";
import { envVarRoutes } from "./routes/env-vars";
import { domainRoutes } from "./routes/domains";
import { webhookRoutes } from "./routes/webhooks";
import { errorHandler } from "./middleware/error-handler";
import { rateLimiter } from "./middleware/rate-limiter";
import type { AppEnv } from "./types";

export const app = new Hono<AppEnv>();

// Global middleware
app.use("*", logger());
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: process.env.DASHBOARD_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use("*", rateLimiter());

// Error handling
app.onError(errorHandler);

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.route("/auth", authRoutes);
app.route("/projects", projectRoutes);
app.route("/deployments", deploymentRoutes);
app.route("/projects/:projectId/env", envVarRoutes);
app.route("/projects/:projectId/domains", domainRoutes);
app.route("/webhooks", webhookRoutes);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "The requested resource was not found",
      },
    },
    404
  );
});
