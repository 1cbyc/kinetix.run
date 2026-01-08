import { db, deployments, projects, functions } from "@kinetix/db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  generateId,
  type TriggerDeploymentInput,
  type PaginationInput,
  type DeploymentStatus,
} from "@kinetix/shared";
import { notFound, forbidden } from "../middleware/error-handler";

export async function createDeployment(
  projectId: string,
  userId: string,
  input: TriggerDeploymentInput
) {
  // Verify project ownership
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, userId)),
  });

  if (!project) {
    notFound("Project");
  }

  const deploymentId = generateId("dpl");

  const [deployment] = await db
    .insert(deployments)
    .values({
      id: deploymentId,
      projectId,
      status: "queued",
      environment: input.environment,
      gitCommit: input.gitCommit || null,
      gitBranch: input.gitBranch || project.gitBranch,
    })
    .returning();

  // TODO: Queue build job

  return deployment;
}

export async function getDeploymentById(deploymentId: string, userId: string) {
  const deployment = await db.query.deployments.findFirst({
    where: eq(deployments.id, deploymentId),
    with: {
      project: {
        columns: {
          id: true,
          name: true,
          slug: true,
          userId: true,
        },
      },
      functions: true,
    },
  });

  if (!deployment) {
    notFound("Deployment");
  }

  // Verify ownership through project
  if (deployment.project.userId !== userId) {
    forbidden("Access denied");
  }

  return deployment;
}

export async function listDeployments(
  projectId: string,
  userId: string,
  pagination: PaginationInput
) {
  // Verify project ownership
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, userId)),
  });

  if (!project) {
    notFound("Project");
  }

  const { page, limit } = pagination;
  const offset = (page - 1) * limit;

  const [deploymentsList, countResult] = await Promise.all([
    db.query.deployments.findMany({
      where: eq(deployments.projectId, projectId),
      orderBy: [desc(deployments.createdAt)],
      limit,
      offset,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(deployments)
      .where(eq(deployments.projectId, projectId)),
  ]);

  const total = Number(countResult[0]?.count || 0);

  return {
    data: deploymentsList,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function updateDeploymentStatus(
  deploymentId: string,
  status: DeploymentStatus,
  extra?: {
    buildLogs?: string;
    buildDuration?: number;
    url?: string;
    readyAt?: Date;
  }
) {
  const [updated] = await db
    .update(deployments)
    .set({
      status,
      ...extra,
      updatedAt: new Date(),
    })
    .where(eq(deployments.id, deploymentId))
    .returning();

  return updated;
}

export async function rollbackDeployment(
  deploymentId: string,
  userId: string
) {
  // Get the deployment to rollback to
  const targetDeployment = await getDeploymentById(deploymentId, userId);

  if (targetDeployment.status !== "ready") {
    throw new Error("Can only rollback to successful deployments");
  }

  // Create a new deployment based on the target
  const newDeploymentId = generateId("dpl");

  const [newDeployment] = await db
    .insert(deployments)
    .values({
      id: newDeploymentId,
      projectId: targetDeployment.projectId,
      status: "deploying",
      environment: targetDeployment.environment,
      gitCommit: targetDeployment.gitCommit,
      gitBranch: targetDeployment.gitBranch,
      gitMessage: `Rollback to ${targetDeployment.id}`,
    })
    .returning();

  // Copy functions from target deployment
  const targetFunctions = await db.query.functions.findMany({
    where: eq(functions.deploymentId, deploymentId),
  });

  if (targetFunctions.length > 0) {
    await db.insert(functions).values(
      targetFunctions.map((fn) => ({
        ...fn,
        id: generateId("fn"),
        deploymentId: newDeploymentId,
        createdAt: new Date(),
      }))
    );
  }

  // Mark as ready (instant rollback)
  await updateDeploymentStatus(newDeploymentId, "ready", {
    readyAt: new Date(),
    url: targetDeployment.url,
  });

  return newDeployment;
}

export async function cancelDeployment(deploymentId: string, userId: string) {
  const deployment = await getDeploymentById(deploymentId, userId);

  if (!["queued", "building"].includes(deployment.status)) {
    throw new Error("Can only cancel queued or building deployments");
  }

  return updateDeploymentStatus(deploymentId, "cancelled");
}
