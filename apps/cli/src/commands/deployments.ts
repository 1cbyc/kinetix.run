import { Command } from "commander";
import { config } from "../lib/config.js";
import { apiClient, ApiError } from "../lib/api-client.js";
import { success, error, log, printTable } from "../lib/output.js";
import {
  formatRelativeTime,
  formatCommit,
  formatDuration,
  getStatusColor,
} from "../lib/utils.js";
import chalk from "chalk";
import ora from "ora";
import type { Deployment, DeploymentStatus } from "@kinetix/shared";

function requireAuth() {
  const token = config.get("accessToken");
  if (!token) {
    error("Not logged in. Run 'kinetix auth login' to login.");
    process.exit(1);
  }
}

export function createDeploymentsCommands(program: Command) {
  const deployments = program
    .command("deployments")
    .alias("deploys")
    .description("Manage deployments");

  // Deploy command (standalone)
  const deployCmd = program
    .command("deploy <projectId>")
    .description("Deploy a project")
    .option("--branch <branch>", "Git branch")
    .option("--commit <commit>", "Git commit SHA")
    .option(
      "--env <environment>",
      "Environment",
      "preview"
    )
    .action(async (projectId, options) => {
      requireAuth();
      try {
        const spinner = ora("Starting deployment...").start();

        try {
          const deployment = await apiClient.post<Deployment>(
            `/projects/${projectId}/deployments`,
            {
              gitBranch: options.branch,
              gitCommit: options.commit,
              environment: options.env,
            }
          );

          spinner.succeed(`Deployment started: ${deployment.id}`);
          success(`Deployment status: ${deployment.status}`);
          log(`View deployment: kinetix deployments get ${deployment.id}`);
        } catch (err) {
          spinner.fail("Failed to start deployment");
          throw err;
        }
      } catch (err) {
        if (err instanceof ApiError) {
          error(err.message);
        } else {
          error("An unexpected error occurred");
        }
        process.exit(1);
      }
    });

  // List deployments
  deployments
    .command("list <projectId>")
    .alias("ls")
    .description("List deployments for a project")
    .action(async (projectId) => {
      requireAuth();
      try {
        const spinner = ora("Fetching deployments...").start();

        try {
          const response = await apiClient.get<{
            data: Deployment[];
            pagination: {
              page: number;
              limit: number;
              total: number;
              totalPages: number;
            };
          }>(`/projects/${projectId}/deployments`);

          spinner.succeed();

          if (response.data.length === 0) {
            log(chalk.gray("No deployments found"));
            return;
          }

          const tableData = response.data.map((deployment) => {
            const statusColor = getStatusColor(deployment.status);
            return [
              deployment.id.substring(0, 8),
              statusColor(deployment.status),
              deployment.environment,
              formatCommit(deployment.gitCommit),
              deployment.gitBranch || "—",
              deployment.buildDuration
                ? formatDuration(deployment.buildDuration)
                : "—",
              formatRelativeTime(deployment.createdAt),
            ];
          });

          printTable(tableData, [
            "ID",
            "Status",
            "Environment",
            "Commit",
            "Branch",
            "Duration",
            "Created",
          ]);

          log("");
          log(chalk.gray(`Total: ${response.pagination.total} deployment(s)`));
        } catch (err) {
          spinner.fail("Failed to fetch deployments");
          throw err;
        }
      } catch (err) {
        if (err instanceof ApiError) {
          error(err.message);
        } else {
          error("An unexpected error occurred");
        }
        process.exit(1);
      }
    });

  // Get deployment
  deployments
    .command("get <id>")
    .alias("show")
    .description("Get deployment details")
    .action(async (id) => {
      requireAuth();
      try {
        const spinner = ora("Fetching deployment...").start();

        try {
          const deployment = await apiClient.get<Deployment>(
            `/deployments/${id}`
          );

          spinner.succeed();

          const statusColor = getStatusColor(deployment.status);

          log("");
          log(chalk.bold("Deployment Details:"));
          log(`  ID: ${deployment.id}`);
          log(`  Status: ${statusColor(deployment.status)}`);
          log(`  Environment: ${deployment.environment}`);
          if (deployment.gitCommit) {
            log(`  Commit: ${formatCommit(deployment.gitCommit)}`);
          }
          if (deployment.gitBranch) {
            log(`  Branch: ${deployment.gitBranch}`);
          }
          if (deployment.gitMessage) {
            log(`  Message: ${deployment.gitMessage}`);
          }
          if (deployment.gitAuthor) {
            log(`  Author: ${deployment.gitAuthor}`);
          }
          if (deployment.buildDuration) {
            log(`  Build Duration: ${formatDuration(deployment.buildDuration)}`);
          }
          if (deployment.url) {
            log(`  URL: ${chalk.blue(deployment.url)}`);
          }
          log(`  Created: ${new Date(deployment.createdAt).toLocaleString()}`);
          if (deployment.readyAt) {
            log(`  Ready: ${new Date(deployment.readyAt).toLocaleString()}`);
          }
        } catch (err) {
          spinner.fail("Failed to fetch deployment");
          throw err;
        }
      } catch (err) {
        if (err instanceof ApiError) {
          error(err.message);
        } else {
          error("An unexpected error occurred");
        }
        process.exit(1);
      }
    });

  // Deployment logs
  deployments
    .command("logs <id>")
    .description("View deployment logs")
    .action(async (id) => {
      requireAuth();
      try {
        const spinner = ora("Fetching logs...").start();

        try {
          const logs = await apiClient.get<{
            logs: string[];
            message?: string;
          }>(`/deployments/${id}/logs`);

          spinner.succeed();

          if (logs.message) {
            log(chalk.yellow(logs.message));
          }

          if (logs.logs && logs.logs.length > 0) {
            log("");
            logs.logs.forEach((logLine) => {
              log(logLine);
            });
          } else {
            log(chalk.gray("No logs available"));
          }
        } catch (err) {
          spinner.fail("Failed to fetch logs");
          throw err;
        }
      } catch (err) {
        if (err instanceof ApiError) {
          error(err.message);
        } else {
          error("An unexpected error occurred");
        }
        process.exit(1);
      }
    });
}