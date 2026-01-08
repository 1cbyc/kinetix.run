// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error codes
export const ERROR_CODES = {
  // Auth errors
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  UNAUTHORIZED: "UNAUTHORIZED",

  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",

  // Resource errors
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CONFLICT: "CONFLICT",

  // Rate limiting
  RATE_LIMITED: "RATE_LIMITED",

  // Server errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",

  // Build/Deploy errors
  BUILD_FAILED: "BUILD_FAILED",
  DEPLOY_FAILED: "DEPLOY_FAILED",
  RUNTIME_NOT_SUPPORTED: "RUNTIME_NOT_SUPPORTED",
} as const;

// Runtime configurations
export const RUNTIMES = {
  nodejs18: {
    name: "Node.js 18",
    version: "18",
    dockerImage: "node:18-alpine",
    extension: ".js",
    configFiles: ["package.json"],
  },
  nodejs20: {
    name: "Node.js 20",
    version: "20",
    dockerImage: "node:20-alpine",
    extension: ".js",
    configFiles: ["package.json"],
  },
  nodejs22: {
    name: "Node.js 22",
    version: "22",
    dockerImage: "node:22-alpine",
    extension: ".js",
    configFiles: ["package.json"],
  },
  python39: {
    name: "Python 3.9",
    version: "3.9",
    dockerImage: "python:3.9-slim",
    extension: ".py",
    configFiles: ["requirements.txt", "pyproject.toml"],
  },
  python310: {
    name: "Python 3.10",
    version: "3.10",
    dockerImage: "python:3.10-slim",
    extension: ".py",
    configFiles: ["requirements.txt", "pyproject.toml"],
  },
  python311: {
    name: "Python 3.11",
    version: "3.11",
    dockerImage: "python:3.11-slim",
    extension: ".py",
    configFiles: ["requirements.txt", "pyproject.toml"],
  },
  python312: {
    name: "Python 3.12",
    version: "3.12",
    dockerImage: "python:3.12-slim",
    extension: ".py",
    configFiles: ["requirements.txt", "pyproject.toml"],
  },
  go120: {
    name: "Go 1.20",
    version: "1.20",
    dockerImage: "golang:1.20-alpine",
    extension: ".go",
    configFiles: ["go.mod"],
  },
  go121: {
    name: "Go 1.21",
    version: "1.21",
    dockerImage: "golang:1.21-alpine",
    extension: ".go",
    configFiles: ["go.mod"],
  },
  rust: {
    name: "Rust",
    version: "latest",
    dockerImage: "rust:slim",
    extension: ".rs",
    configFiles: ["Cargo.toml"],
  },
  deno: {
    name: "Deno",
    version: "latest",
    dockerImage: "denoland/deno:latest",
    extension: ".ts",
    configFiles: ["deno.json", "deno.jsonc"],
  },
} as const;

// Function limits
export const FUNCTION_LIMITS = {
  maxExecutionTime: 30_000, // 30 seconds
  maxMemory: 128 * 1024 * 1024, // 128 MB
  maxBundleSize: 50 * 1024 * 1024, // 50 MB
  maxEnvVarSize: 64 * 1024, // 64 KB
  maxEnvVars: 100,
  maxDomainsPerProject: 10,
  maxFunctionsPerDeployment: 100,
} as const;

// Default values
export const DEFAULTS = {
  gitBranch: "main",
  rootDirectory: "/",
  functionTimeout: 10_000, // 10 seconds
  functionMemory: 128, // 128 MB
  deploymentRetention: 100, // keep last 100 deployments
  logRetentionDays: 30,
} as const;

// JWT configuration
export const JWT_CONFIG = {
  accessTokenExpiry: "15m",
  refreshTokenExpiry: "7d",
  issuer: "kinetix.run",
} as const;

// Rate limiting
export const RATE_LIMITS = {
  api: {
    windowMs: 60_000, // 1 minute
    maxRequests: 100,
  },
  auth: {
    windowMs: 300_000, // 5 minutes
    maxRequests: 10,
  },
  deployments: {
    windowMs: 3600_000, // 1 hour
    maxRequests: 50,
  },
} as const;

// Build timeouts
export const BUILD_TIMEOUTS = {
  clone: 60_000, // 1 minute
  install: 300_000, // 5 minutes
  build: 600_000, // 10 minutes
  total: 900_000, // 15 minutes
} as const;

// Edge locations (subset for MVP)
export const EDGE_LOCATIONS = [
  { code: "iad", name: "Washington, D.C.", region: "us-east" },
  { code: "sfo", name: "San Francisco", region: "us-west" },
  { code: "lhr", name: "London", region: "eu-west" },
  { code: "fra", name: "Frankfurt", region: "eu-central" },
  { code: "nrt", name: "Tokyo", region: "asia-northeast" },
  { code: "syd", name: "Sydney", region: "oceania" },
  { code: "sin", name: "Singapore", region: "asia-southeast" },
  { code: "gru", name: "Sao Paulo", region: "south-america" },
] as const;
