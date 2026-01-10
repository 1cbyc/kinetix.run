import type { RuntimeType, EnvironmentType } from "@kinetix/shared";

/**
 * Function execution context
 */
export interface FunctionContext {
  functionId: string;
  deploymentId: string;
  projectId: string;
  runtime: RuntimeType;
  environment: EnvironmentType;
  memory?: number;
  timeout?: number;
}

/**
 * Function invocation request
 */
export interface FunctionInvocation {
  context: FunctionContext;
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
    query: Record<string, string>;
    params: Record<string, string>;
  };
  envVars: Record<string, string>;
}

/**
 * Function invocation response
 */
export interface FunctionResponse {
  statusCode: number;
  headers: Record<string, string>;
  body?: string;
  executionTime: number;
}

/**
 * Function execution result
 */
export interface ExecutionResult {
  success: boolean;
  response?: FunctionResponse;
  error?: {
    type: "timeout" | "runtime" | "memory" | "network" | "unknown";
    message: string;
    stack?: string;
  };
  logs: string[];
  metrics: {
    coldStart: boolean;
    executionTime: number;
    memoryUsed?: number;
    cpuTime?: number;
  };
}

/**
 * Function runtime environment
 */
export interface RuntimeEnvironment {
  runtime: RuntimeType;
  version: string;
  baseImage?: string;
  entrypoint: string;
  environment: Record<string, string>;
}

/**
 * Function cache entry
 */
export interface FunctionCache {
  functionId: string;
  deploymentId: string;
  lastAccessed: Date;
  instance?: FunctionInstance;
  warmTime: number;
}

/**
 * Function instance (for warm functions)
 */
export interface FunctionInstance {
  functionId: string;
  deploymentId: string;
  runtime: RuntimeType;
  process?: NodeJS.Process;
  port?: number;
  startedAt: Date;
  lastRequest: Date;
  requestCount: number;
}

/**
 * Request routing result
 */
export interface RouteResult {
  found: boolean;
  function?: {
    id: string;
    path: string;
    handler: string;
    context: FunctionContext;
  };
  domain?: {
    id: string;
    name: string;
    verified: boolean;
  };
  error?: {
    code: "NOT_FOUND" | "DOMAIN_NOT_VERIFIED" | "FUNCTION_DISABLED";
    message: string;
  };
}

/**
 * Edge router configuration
 */
export interface EdgeRouterConfig {
  maxConcurrency: number;
  coldStartTimeout: number;
  warmTimeout: number;
  maxMemory: number;
  logLevel: "debug" | "info" | "warn" | "error";
  enableCaching: boolean;
  cacheTtl: number;
}