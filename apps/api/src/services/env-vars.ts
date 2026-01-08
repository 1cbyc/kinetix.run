import crypto from "crypto";
import { db, envVars, projects } from "@kinetix/db";
import { eq, and } from "drizzle-orm";
import {
  generateId,
  type CreateEnvVarInput,
  type EnvironmentType,
} from "@kinetix/shared";
import { notFound, conflict } from "../middleware/error-handler";

// Encryption key from environment (32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "0".repeat(64);
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const key = Buffer.from(ENCRYPTION_KEY, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export async function createEnvVar(
  projectId: string,
  userId: string,
  input: CreateEnvVarInput
) {
  // Verify project ownership
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, userId)),
  });

  if (!project) {
    notFound("Project");
  }

  // Check if key already exists for this environment
  const existing = await db.query.envVars.findFirst({
    where: and(
      eq(envVars.projectId, projectId),
      eq(envVars.key, input.key),
      eq(envVars.environment, input.environment)
    ),
  });

  if (existing) {
    conflict(`Environment variable ${input.key} already exists`);
  }

  const encryptedValue = encrypt(input.value);

  const [envVar] = await db
    .insert(envVars)
    .values({
      id: generateId("env"),
      projectId,
      key: input.key,
      encryptedValue,
      environment: input.environment,
    })
    .returning({
      id: envVars.id,
      key: envVars.key,
      environment: envVars.environment,
      createdAt: envVars.createdAt,
      updatedAt: envVars.updatedAt,
    });

  return envVar;
}

export async function listEnvVars(
  projectId: string,
  userId: string,
  environment?: EnvironmentType
) {
  // Verify project ownership
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, userId)),
  });

  if (!project) {
    notFound("Project");
  }

  const conditions = [eq(envVars.projectId, projectId)];

  if (environment) {
    conditions.push(eq(envVars.environment, environment));
  }

  const vars = await db.query.envVars.findMany({
    where: and(...conditions),
    columns: {
      id: true,
      key: true,
      environment: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return vars;
}

export async function updateEnvVar(
  projectId: string,
  userId: string,
  key: string,
  environment: EnvironmentType,
  value: string
) {
  // Verify project ownership
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, userId)),
  });

  if (!project) {
    notFound("Project");
  }

  const existing = await db.query.envVars.findFirst({
    where: and(
      eq(envVars.projectId, projectId),
      eq(envVars.key, key),
      eq(envVars.environment, environment)
    ),
  });

  if (!existing) {
    notFound("Environment variable");
  }

  const encryptedValue = encrypt(value);

  const [updated] = await db
    .update(envVars)
    .set({
      encryptedValue,
      updatedAt: new Date(),
    })
    .where(eq(envVars.id, existing.id))
    .returning({
      id: envVars.id,
      key: envVars.key,
      environment: envVars.environment,
      createdAt: envVars.createdAt,
      updatedAt: envVars.updatedAt,
    });

  return updated;
}

export async function deleteEnvVar(
  projectId: string,
  userId: string,
  key: string,
  environment: EnvironmentType
) {
  // Verify project ownership
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, userId)),
  });

  if (!project) {
    notFound("Project");
  }

  const existing = await db.query.envVars.findFirst({
    where: and(
      eq(envVars.projectId, projectId),
      eq(envVars.key, key),
      eq(envVars.environment, environment)
    ),
  });

  if (!existing) {
    notFound("Environment variable");
  }

  await db.delete(envVars).where(eq(envVars.id, existing.id));
}

// Internal: Get decrypted env vars for a deployment
export async function getDecryptedEnvVars(
  projectId: string,
  environment: EnvironmentType
): Promise<Record<string, string>> {
  const vars = await db.query.envVars.findMany({
    where: and(
      eq(envVars.projectId, projectId),
      eq(envVars.environment, environment)
    ),
  });

  const result: Record<string, string> = {};

  for (const v of vars) {
    result[v.key] = decrypt(v.encryptedValue);
  }

  return result;
}
