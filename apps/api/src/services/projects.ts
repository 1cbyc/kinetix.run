import { db, projects, deployments } from "@kinetix/db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  generateId,
  slugify,
  type CreateProjectInput,
  type UpdateProjectInput,
  type PaginationInput,
} from "@kinetix/shared";
import { notFound, conflict } from "../middleware/error-handler";

export async function createProject(userId: string, input: CreateProjectInput) {
  // Check if slug is unique
  const existingSlug = await db.query.projects.findFirst({
    where: eq(projects.slug, input.slug),
  });

  if (existingSlug) {
    conflict("Project slug already exists");
  }

  const projectId = generateId("prj");

  const [project] = await db
    .insert(projects)
    .values({
      id: projectId,
      userId,
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      gitRepoUrl: input.gitRepoUrl || null,
      gitBranch: input.gitBranch,
      rootDirectory: input.rootDirectory,
      buildCommand: input.buildCommand || null,
      installCommand: input.installCommand || null,
    })
    .returning();

  return project;
}

export async function getProjectById(projectId: string, userId: string) {
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, userId)),
    with: {
      deployments: {
        limit: 5,
        orderBy: [desc(deployments.createdAt)],
      },
    },
  });

  if (!project) {
    notFound("Project");
  }

  return project;
}

export async function getProjectBySlug(slug: string, userId: string) {
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.slug, slug), eq(projects.userId, userId)),
  });

  if (!project) {
    notFound("Project");
  }

  return project;
}

export async function listProjects(userId: string, pagination: PaginationInput) {
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;

  const [projectsList, countResult] = await Promise.all([
    db.query.projects.findMany({
      where: eq(projects.userId, userId),
      orderBy: [desc(projects.updatedAt)],
      limit,
      offset,
      with: {
        deployments: {
          limit: 1,
          orderBy: [desc(deployments.createdAt)],
          columns: {
            id: true,
            status: true,
            url: true,
            createdAt: true,
          },
        },
      },
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.userId, userId)),
  ]);

  const total = Number(countResult[0]?.count || 0);

  return {
    data: projectsList,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function updateProject(
  projectId: string,
  userId: string,
  input: UpdateProjectInput
) {
  // Verify ownership
  const existing = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, userId)),
  });

  if (!existing) {
    notFound("Project");
  }

  // Check slug uniqueness if changing
  if (input.slug && input.slug !== existing.slug) {
    const existingSlug = await db.query.projects.findFirst({
      where: eq(projects.slug, input.slug),
    });

    if (existingSlug) {
      conflict("Project slug already exists");
    }
  }

  const [updated] = await db
    .update(projects)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId))
    .returning();

  return updated;
}

export async function deleteProject(projectId: string, userId: string) {
  // Verify ownership
  const existing = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, userId)),
  });

  if (!existing) {
    notFound("Project");
  }

  // Delete project (cascades to deployments, functions, etc.)
  await db.delete(projects).where(eq(projects.id, projectId));
}

export async function generateUniqueSlug(baseName: string): Promise<string> {
  const baseSlug = slugify(baseName);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.query.projects.findFirst({
      where: eq(projects.slug, slug),
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;

    if (counter > 100) {
      // Fallback to adding random suffix
      slug = `${baseSlug}-${generateId()}`;
      break;
    }
  }

  return slug;
}
