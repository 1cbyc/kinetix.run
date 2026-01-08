import { Hono } from "hono";
import {
  getDeploymentById,
  rollbackDeployment,
  cancelDeployment,
} from "../services/deployments";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types";

export const deploymentRoutes = new Hono<AppEnv>();

// All deployment routes require authentication
deploymentRoutes.use("*", requireAuth);

// Get deployment by ID
deploymentRoutes.get("/:deploymentId", async (c) => {
  const userId = c.get("userId")!;
  const { deploymentId } = c.req.param();

  const deployment = await getDeploymentById(deploymentId, userId);

  return c.json({
    success: true,
    data: deployment,
  });
});

// Rollback to deployment
deploymentRoutes.post("/:deploymentId/rollback", async (c) => {
  const userId = c.get("userId")!;
  const { deploymentId } = c.req.param();

  const deployment = await rollbackDeployment(deploymentId, userId);

  return c.json({
    success: true,
    data: deployment,
  });
});

// Cancel deployment
deploymentRoutes.post("/:deploymentId/cancel", async (c) => {
  const userId = c.get("userId")!;
  const { deploymentId } = c.req.param();

  const deployment = await cancelDeployment(deploymentId, userId);

  return c.json({
    success: true,
    data: deployment,
  });
});

// Get deployment logs (placeholder)
deploymentRoutes.get("/:deploymentId/logs", async (c) => {
  const userId = c.get("userId")!;
  const { deploymentId } = c.req.param();

  // Verify access
  await getDeploymentById(deploymentId, userId);

  // TODO: Implement log retrieval
  return c.json({
    success: true,
    data: {
      logs: [],
      message: "Log streaming not yet implemented",
    },
  });
});

// Get deployment functions
deploymentRoutes.get("/:deploymentId/functions", async (c) => {
  const userId = c.get("userId")!;
  const { deploymentId } = c.req.param();

  const deployment = await getDeploymentById(deploymentId, userId);

  return c.json({
    success: true,
    data: deployment.functions,
  });
});
