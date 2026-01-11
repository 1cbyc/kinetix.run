import { Command } from "commander";
import inquirer from "inquirer";
import { config } from "../lib/config.js";
import { apiClient, ApiError } from "../lib/api-client.js";
import { success, error, log, printTable } from "../lib/output.js";
import chalk from "chalk";
import ora from "ora";
import type { EnvVar, EnvironmentType } from "@kinetix/shared";

function requireAuth() {
  const token = config.get("accessToken");
  if (!token) {
    error("Not logged in. Run 'kinetix auth login' to login.");
    process.exit(1);
  }
}

export function createEnvVarsCommands(program: Command) {
  const envVars = program
    .command("env")
    .alias("envvars")
    .alias("env-vars")
    .description("Manage environment variables");

  // List env vars
  envVars
    .command("list <projectId>")
    .alias("ls")
    .description("List environment variables for a project")
    .option("-e, --env <environment>", "Environment (production, preview, development)", "production")
    .action(async (projectId, options) => {
      requireAuth();
      try {
        const spinner = ora("Fetching environment variables...").start();

        try {
          const envVarList = await apiClient.get<EnvVar[]>(
            `/projects/${projectId}/env?environment=${options.env}`
          );

          spinner.succeed();

          if (envVarList.length === 0) {
            log(chalk.gray(`No environment variables found for ${options.env} environment`));
            return;
          }

          const tableData = envVarList.map((envVar) => [
            envVar.key,
            envVar.environment,
            "••••••••",
            new Date(envVar.createdAt).toLocaleDateString(),
          ]);

          printTable(tableData, ["Key", "Environment", "Value", "Created"]);

          log("");
          log(chalk.gray(`Total: ${envVarList.length} variable(s)`));
        } catch (err) {
          spinner.fail("Failed to fetch environment variables");
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

  // Add env var
  envVars
    .command("set <projectId> <key> <value>")
    .description("Set an environment variable")
    .option("-e, --env <environment>", "Environment (production, preview, development)", "production")
    .action(async (projectId, key, value, options) => {
      requireAuth();
      try {
        const spinner = ora("Setting environment variable...").start();

        try {
          await apiClient.post(`/projects/${projectId}/env`, {
            key,
            value,
            environment: options.env,
          });

          spinner.succeed("Environment variable set successfully");
          success(`Set ${key} for ${options.env} environment`);
        } catch (err) {
          spinner.fail("Failed to set environment variable");
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

  // Delete env var
  envVars
    .command("delete <projectId> <key>")
    .alias("rm")
    .alias("unset")
    .description("Delete an environment variable")
    .option("-e, --env <environment>", "Environment (production, preview, development)", "production")
    .option("-f, --force", "Skip confirmation")
    .action(async (projectId, key, options) => {
      requireAuth();
      try {
        if (!options.force) {
          const { confirm } = await inquirer.prompt([
            {
              type: "confirm",
              name: "confirm",
              message: `Are you sure you want to delete ${key} from ${options.env}?`,
              default: false,
            },
          ]);

          if (!confirm) {
            log(chalk.gray("Cancelled"));
            return;
          }
        }

        const spinner = ora("Deleting environment variable...").start();

        try {
          await apiClient.delete(
            `/projects/${projectId}/env/${key}?environment=${options.env}`
          );
          spinner.succeed("Environment variable deleted successfully");
        } catch (err) {
          spinner.fail("Failed to delete environment variable");
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