import { Hono } from "hono";
import { CreateEnvVarSchema, EnvironmentType } from "@kinetix/shared";
import {
  createEnvVar,
  listEnvVars,
  updateEnvVar,
  deleteEnvVar,
} from "../services/env-vars";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types";

type EnvVarEnv = AppEnv & {
  Variables: AppEnv["Variables"] & { projectId: string };
};

export const envVarRoutes = new Hono<EnvVarEnv>();

// All env var routes require authentication
envVarRoutes.use("*", requireAuth);

// List environment variables
envVarRoutes.get("/", async (c) => {
  const userId = c.get("userId")!;
  const projectId = c.req.param("projectId");
  const environment = c.req.query("environment") as string | undefined;

  const envVarsList = await listEnvVars(
    projectId,
    userId,
    environment ? EnvironmentType.parse(environment) : undefined
  );

  return c.json({
    success: true,
    data: envVarsList,
  });
});

// Create environment variable
envVarRoutes.post("/", async (c) => {
  const userId = c.get("userId")!;
  const projectId = c.req.param("projectId");
  const body = await c.req.json();
  const input = CreateEnvVarSchema.parse(body);

  const envVar = await createEnvVar(projectId, userId, input);

  return c.json(
    {
      success: true,
      data: envVar,
    },
    201
  );
});

// Update environment variable
envVarRoutes.patch("/:key", async (c) => {
  const userId = c.get("userId")!;
  const projectId = c.req.param("projectId");
  const key = c.req.param("key");
  const body = await c.req.json();
  const { value, environment } = body;

  if (!value || !environment) {
    return c.json(
      {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "Value and environment are required",
        },
      },
      400
    );
  }

  const envVar = await updateEnvVar(
    projectId,
    userId,
    key,
    EnvironmentType.parse(environment),
    value
  );

  return c.json({
    success: true,
    data: envVar,
  });
});

// Delete environment variable
envVarRoutes.delete("/:key", async (c) => {
  const userId = c.get("userId")!;
  const projectId = c.req.param("projectId");
  const key = c.req.param("key");
  const environment = c.req.query("environment");

  if (!environment) {
    return c.json(
      {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "Environment query parameter is required",
        },
      },
      400
    );
  }

  await deleteEnvVar(
    projectId,
    userId,
    key,
    EnvironmentType.parse(environment)
  );

  return c.json({
    success: true,
    data: { message: "Environment variable deleted" },
  });
});
