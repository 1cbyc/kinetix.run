import {
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const deploymentStatusEnum = pgEnum("deployment_status", [
  "queued",
  "building",
  "deploying",
  "ready",
  "failed",
  "cancelled",
]);

export const environmentTypeEnum = pgEnum("environment_type", [
  "production",
  "preview",
  "development",
]);

export const logLevelEnum = pgEnum("log_level", [
  "debug",
  "info",
  "warn",
  "error",
]);

export const domainStatusEnum = pgEnum("domain_status", [
  "pending",
  "verifying",
  "verified",
  "failed",
]);

export const sslStatusEnum = pgEnum("ssl_status", [
  "pending",
  "provisioning",
  "active",
  "expired",
  "failed",
]);

export const gitProviderEnum = pgEnum("git_provider", [
  "github",
  "gitlab",
  "bitbucket",
]);

export const runtimeTypeEnum = pgEnum("runtime_type", [
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

// Users table
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 26 }).primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    name: varchar("name", { length: 100 }),
    avatarUrl: text("avatar_url"),
    emailVerified: boolean("email_verified").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
  })
);

// Projects table
export const projects = pgTable(
  "projects",
  {
    id: varchar("id", { length: 26 }).primaryKey(),
    userId: varchar("user_id", { length: 26 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    description: text("description"),
    gitProvider: gitProviderEnum("git_provider"),
    gitRepoUrl: text("git_repo_url"),
    gitRepoId: varchar("git_repo_id", { length: 100 }),
    gitBranch: varchar("git_branch", { length: 255 }).default("main").notNull(),
    rootDirectory: varchar("root_directory", { length: 500 })
      .default("/")
      .notNull(),
    buildCommand: text("build_command"),
    installCommand: text("install_command"),
    framework: varchar("framework", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("projects_user_id_idx").on(table.userId),
    slugIdx: uniqueIndex("projects_slug_idx").on(table.slug),
  })
);

// Deployments table
export const deployments = pgTable(
  "deployments",
  {
    id: varchar("id", { length: 26 }).primaryKey(),
    projectId: varchar("project_id", { length: 26 })
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    status: deploymentStatusEnum("status").default("queued").notNull(),
    environment: environmentTypeEnum("environment").default("preview").notNull(),
    gitCommit: varchar("git_commit", { length: 40 }),
    gitBranch: varchar("git_branch", { length: 255 }),
    gitMessage: text("git_message"),
    gitAuthor: varchar("git_author", { length: 255 }),
    buildLogs: text("build_logs"),
    buildDuration: integer("build_duration"),
    url: text("url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    readyAt: timestamp("ready_at", { withTimezone: true }),
  },
  (table) => ({
    projectIdIdx: index("deployments_project_id_idx").on(table.projectId),
    statusIdx: index("deployments_status_idx").on(table.status),
    createdAtIdx: index("deployments_created_at_idx").on(table.createdAt),
  })
);

// Functions table
export const functions = pgTable(
  "functions",
  {
    id: varchar("id", { length: 26 }).primaryKey(),
    deploymentId: varchar("deployment_id", { length: 26 })
      .notNull()
      .references(() => deployments.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    route: varchar("route", { length: 500 }).notNull(),
    runtime: runtimeTypeEnum("runtime").notNull(),
    entrypoint: varchar("entrypoint", { length: 500 }).notNull(),
    bundleUrl: text("bundle_url"),
    bundleSize: integer("bundle_size"),
    timeout: integer("timeout").default(10000).notNull(),
    memory: integer("memory").default(128).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    deploymentIdIdx: index("functions_deployment_id_idx").on(table.deploymentId),
    routeIdx: index("functions_route_idx").on(table.route),
  })
);

// Environment variables table
export const envVars = pgTable(
  "env_vars",
  {
    id: varchar("id", { length: 26 }).primaryKey(),
    projectId: varchar("project_id", { length: 26 })
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 256 }).notNull(),
    encryptedValue: text("encrypted_value").notNull(),
    environment: environmentTypeEnum("environment").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    projectIdIdx: index("env_vars_project_id_idx").on(table.projectId),
    uniqueKeyEnv: uniqueIndex("env_vars_unique_key_env").on(
      table.projectId,
      table.key,
      table.environment
    ),
  })
);

// Domains table
export const domains = pgTable(
  "domains",
  {
    id: varchar("id", { length: 26 }).primaryKey(),
    projectId: varchar("project_id", { length: 26 })
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    domain: varchar("domain", { length: 253 }).notNull(),
    status: domainStatusEnum("status").default("pending").notNull(),
    sslStatus: sslStatusEnum("ssl_status").default("pending").notNull(),
    verificationToken: varchar("verification_token", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    projectIdIdx: index("domains_project_id_idx").on(table.projectId),
    domainIdx: uniqueIndex("domains_domain_idx").on(table.domain),
  })
);

// Log entries table
export const logEntries = pgTable(
  "log_entries",
  {
    id: varchar("id", { length: 26 }).primaryKey(),
    functionId: varchar("function_id", { length: 26 })
      .notNull()
      .references(() => functions.id, { onDelete: "cascade" }),
    deploymentId: varchar("deployment_id", { length: 26 })
      .notNull()
      .references(() => deployments.id, { onDelete: "cascade" }),
    level: logLevelEnum("level").notNull(),
    message: text("message").notNull(),
    metadata: text("metadata"), // JSON stored as text
    timestamp: timestamp("timestamp", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    functionIdIdx: index("log_entries_function_id_idx").on(table.functionId),
    deploymentIdIdx: index("log_entries_deployment_id_idx").on(
      table.deploymentId
    ),
    timestampIdx: index("log_entries_timestamp_idx").on(table.timestamp),
  })
);

// API keys table
export const apiKeys = pgTable(
  "api_keys",
  {
    id: varchar("id", { length: 26 }).primaryKey(),
    userId: varchar("user_id", { length: 26 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    keyHash: text("key_hash").notNull(),
    keyPrefix: varchar("key_prefix", { length: 12 }).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("api_keys_user_id_idx").on(table.userId),
    keyPrefixIdx: index("api_keys_key_prefix_idx").on(table.keyPrefix),
  })
);

// Refresh tokens table
export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: varchar("id", { length: 26 }).primaryKey(),
    userId: varchar("user_id", { length: 26 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("refresh_tokens_user_id_idx").on(table.userId),
    tokenHashIdx: index("refresh_tokens_token_hash_idx").on(table.tokenHash),
  })
);

// Git installations table (for GitHub App, etc.)
export const gitInstallations = pgTable(
  "git_installations",
  {
    id: varchar("id", { length: 26 }).primaryKey(),
    userId: varchar("user_id", { length: 26 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: gitProviderEnum("provider").notNull(),
    installationId: varchar("installation_id", { length: 100 }).notNull(),
    accessToken: text("access_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshToken: text("refresh_token"),
    accountName: varchar("account_name", { length: 255 }),
    accountType: varchar("account_type", { length: 50 }), // user or organization
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("git_installations_user_id_idx").on(table.userId),
    installationIdIdx: uniqueIndex("git_installations_installation_id_idx").on(
      table.provider,
      table.installationId
    ),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  apiKeys: many(apiKeys),
  refreshTokens: many(refreshTokens),
  gitInstallations: many(gitInstallations),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  deployments: many(deployments),
  envVars: many(envVars),
  domains: many(domains),
}));

export const deploymentsRelations = relations(deployments, ({ one, many }) => ({
  project: one(projects, {
    fields: [deployments.projectId],
    references: [projects.id],
  }),
  functions: many(functions),
  logEntries: many(logEntries),
}));

export const functionsRelations = relations(functions, ({ one, many }) => ({
  deployment: one(deployments, {
    fields: [functions.deploymentId],
    references: [deployments.id],
  }),
  logEntries: many(logEntries),
}));

export const envVarsRelations = relations(envVars, ({ one }) => ({
  project: one(projects, {
    fields: [envVars.projectId],
    references: [projects.id],
  }),
}));

export const domainsRelations = relations(domains, ({ one }) => ({
  project: one(projects, {
    fields: [domains.projectId],
    references: [projects.id],
  }),
}));

export const logEntriesRelations = relations(logEntries, ({ one }) => ({
  function: one(functions, {
    fields: [logEntries.functionId],
    references: [functions.id],
  }),
  deployment: one(deployments, {
    fields: [logEntries.deploymentId],
    references: [deployments.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const gitInstallationsRelations = relations(
  gitInstallations,
  ({ one }) => ({
    user: one(users, {
      fields: [gitInstallations.userId],
      references: [users.id],
    }),
  })
);
