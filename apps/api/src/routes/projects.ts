import { Hono } from "hono";
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  PaginationSchema,
  TriggerDeploymentSchema,
} from "@kinetix/shared";
import {
  createProject,
  getProjectById,
  listProjects,
  updateProject,
  deleteProject,
} from "../services/projects";
import {
  createDeployment,
  listDeployments,
} from "../services/deployments";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types";

export const projectRoutes = new Hono<AppEnv>();

// All project routes require authentication
projectRoutes.use("*", requireAuth);

// List projects
projectRoutes.get("/", async (c) => {
  const userId = c.get("userId")!;
  const query = c.req.query();
  const pagination = PaginationSchema.parse(query);

  const result = await listProjects(userId, pagination);

  return c.json({
    success: true,
    data: result,
  });
});

// Create project
projectRoutes.post("/", async (c) => {
  const userId = c.get("userId")!;
  const body = await c.req.json();
  const input = CreateProjectSchema.parse(body);

  const project = await createProject(userId, input);

  return c.json(
    {
      success: true,
      data: project,
    },
    201
  );
});

// Get project by ID
projectRoutes.get("/:projectId", async (c) => {
  const userId = c.get("userId")!;
  const { projectId } = c.req.param();

  const project = await getProjectById(projectId, userId);

  return c.json({
    success: true,
    data: project,
  });
});

// Update project
projectRoutes.patch("/:projectId", async (c) => {
  const userId = c.get("userId")!;
  const { projectId } = c.req.param();
  const body = await c.req.json();
  const input = UpdateProjectSchema.parse(body);

  const project = await updateProject(projectId, userId, input);

  return c.json({
    success: true,
    data: project,
  });
});

// Delete project
projectRoutes.delete("/:projectId", async (c) => {
  const userId = c.get("userId")!;
  const { projectId } = c.req.param();

  await deleteProject(projectId, userId);

  return c.json({
    success: true,
    data: { message: "Project deleted" },
  });
});

// List deployments for project
projectRoutes.get("/:projectId/deployments", async (c) => {
  const userId = c.get("userId")!;
  const { projectId } = c.req.param();
  const query = c.req.query();
  const pagination = PaginationSchema.parse(query);

  const result = await listDeployments(projectId, userId, pagination);

  return c.json({
    success: true,
    ...result,
  });
});

// Trigger deployment
projectRoutes.post("/:projectId/deployments", async (c) => {
  const userId = c.get("userId")!;
  const { projectId } = c.req.param();
  const body = await c.req.json().catch(() => ({}));
  const input = TriggerDeploymentSchema.parse(body);

  const deployment = await createDeployment(projectId, userId, input);

  return c.json(
    {
      success: true,
      data: deployment,
    },
    201
  );
});
