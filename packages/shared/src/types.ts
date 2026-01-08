import { z } from "zod";

// Runtime types
export const RuntimeType = z.enum([
  "nodejs18",
  "nodejs20",
  "nodejs22",
  "python39",
  "python310",
  "python311",
  "python312",
  "go120",
  "go121",
  "rust",
  "deno",
]);
export type RuntimeType = z.infer<typeof RuntimeType>;

// Deployment status
export const DeploymentStatus = z.enum([
  "queued",
  "building",
  "deploying",
  "ready",
  "failed",
  "cancelled",
]);
export type DeploymentStatus = z.infer<typeof DeploymentStatus>;

// Environment type
export const EnvironmentType = z.enum(["production", "preview", "development"]);
export type EnvironmentType = z.infer<typeof EnvironmentType>;

// Log level
export const LogLevel = z.enum(["debug", "info", "warn", "error"]);
export type LogLevel = z.infer<typeof LogLevel>;

// Domain verification status
export const DomainStatus = z.enum([
  "pending",
  "verifying",
  "verified",
  "failed",
]);
export type DomainStatus = z.infer<typeof DomainStatus>;

// SSL status
export const SSLStatus = z.enum([
  "pending",
  "provisioning",
  "active",
  "expired",
  "failed",
]);
export type SSLStatus = z.infer<typeof SSLStatus>;

// Git provider
export const GitProvider = z.enum(["github", "gitlab", "bitbucket"]);
export type GitProvider = z.infer<typeof GitProvider>;

// User
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Project
export interface Project {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description: string | null;
  gitProvider: GitProvider | null;
  gitRepoUrl: string | null;
  gitRepoId: string | null;
  gitBranch: string;
  rootDirectory: string;
  buildCommand: string | null;
  installCommand: string | null;
  framework: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Deployment
export interface Deployment {
  id: string;
  projectId: string;
  status: DeploymentStatus;
  environment: EnvironmentType;
  gitCommit: string | null;
  gitBranch: string | null;
  gitMessage: string | null;
  gitAuthor: string | null;
  buildLogs: string | null;
  buildDuration: number | null;
  url: string | null;
  createdAt: Date;
  updatedAt: Date;
  readyAt: Date | null;
}

// Function (serverless function)
export interface ServerlessFunction {
  id: string;
  deploymentId: string;
  name: string;
  route: string;
  runtime: RuntimeType;
  entrypoint: string;
  bundleUrl: string | null;
  bundleSize: number | null;
  timeout: number;
  memory: number;
  createdAt: Date;
}

// Environment variable
export interface EnvVar {
  id: string;
  projectId: string;
  key: string;
  encryptedValue: string;
  environment: EnvironmentType;
  createdAt: Date;
  updatedAt: Date;
}

// Domain
export interface Domain {
  id: string;
  projectId: string;
  domain: string;
  status: DomainStatus;
  sslStatus: SSLStatus;
  verificationToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Log entry
export interface LogEntry {
  id: string;
  functionId: string;
  deploymentId: string;
  level: LogLevel;
  message: string;
  metadata: Record<string, unknown> | null;
  timestamp: Date;
}

// API key
export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

// API request/response schemas
export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  gitRepoUrl: z.string().url().optional(),
  gitBranch: z.string().default("main"),
  rootDirectory: z.string().default("/"),
  buildCommand: z.string().optional(),
  installCommand: z.string().optional(),
});
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export const UpdateProjectSchema = CreateProjectSchema.partial();
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

export const CreateEnvVarSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(256)
    .regex(/^[A-Z_][A-Z0-9_]*$/),
  value: z.string().max(65536),
  environment: EnvironmentType,
});
export type CreateEnvVarInput = z.infer<typeof CreateEnvVarSchema>;

export const AddDomainSchema = z.object({
  domain: z
    .string()
    .min(1)
    .max(253)
    .regex(/^([a-z0-9-]+\.)+[a-z]{2,}$/i),
});
export type AddDomainInput = z.infer<typeof AddDomainSchema>;

export const TriggerDeploymentSchema = z.object({
  gitCommit: z.string().optional(),
  gitBranch: z.string().optional(),
  environment: EnvironmentType.default("preview"),
});
export type TriggerDeploymentInput = z.infer<typeof TriggerDeploymentSchema>;

// Auth schemas
export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).optional(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type LoginInput = z.infer<typeof LoginSchema>;

// Pagination
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationInput = z.infer<typeof PaginationSchema>;

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// JWT payload
export interface JWTPayload {
  sub: string; // user id
  email: string;
  iat: number;
  exp: number;
}

// Webhook payloads
export interface GitHubWebhookPayload {
  ref: string;
  before: string;
  after: string;
  repository: {
    id: number;
    full_name: string;
    clone_url: string;
  };
  pusher: {
    name: string;
    email: string;
  };
  head_commit: {
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
  } | null;
}
