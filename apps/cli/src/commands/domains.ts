import { Command } from "commander";
import inquirer from "inquirer";
import { config } from "../lib/config.js";
import { apiClient, ApiError } from "../lib/api-client.js";
import { success, error, log, printTable } from "../lib/output.js";
import { getStatusColor } from "../lib/utils.js";
import chalk from "chalk";
import ora from "ora";
import type { Domain } from "@kinetix/shared";

function requireAuth() {
  const token = config.get("accessToken");
  if (!token) {
    error("Not logged in. Run 'kinetix auth login' to login.");
    process.exit(1);
  }
}

export function createDomainsCommands(program: Command) {
  const domains = program
    .command("domains")
    .alias("domain")
    .description("Manage domains");

  // List domains
  domains
    .command("list <projectId>")
    .alias("ls")
    .description("List domains for a project")
    .action(async (projectId) => {
      requireAuth();
      try {
        const spinner = ora("Fetching domains...").start();

        try {
          const domainList = await apiClient.get<Domain[]>(
            `/projects/${projectId}/domains`
          );

          spinner.succeed();

          if (domainList.length === 0) {
            log(chalk.gray("No domains found"));
            return;
          }

          const tableData = domainList.map((domain) => {
            const statusColor = getStatusColor(domain.status);
            const sslColor = getStatusColor(domain.sslStatus);
            return [
              domain.domain,
              statusColor(domain.status),
              sslColor(domain.sslStatus),
              new Date(domain.createdAt).toLocaleDateString(),
            ];
          });

          printTable(tableData, ["Domain", "Status", "SSL Status", "Created"]);
        } catch (err) {
          spinner.fail("Failed to fetch domains");
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

  // Add domain
  domains
    .command("add <projectId> <domain>")
    .description("Add a domain to a project")
    .action(async (projectId, domain) => {
      requireAuth();
      try {
        const spinner = ora("Adding domain...").start();

        try {
          const newDomain = await apiClient.post<Domain>(
            `/projects/${projectId}/domains`,
            { domain }
          );

          spinner.succeed("Domain added successfully");
          success(`Domain '${newDomain.domain}' added`);
          log(`Status: ${newDomain.status}`);
        } catch (err) {
          spinner.fail("Failed to add domain");
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

  // Delete domain
  domains
    .command("delete <projectId> <domainId>")
    .alias("rm")
    .description("Delete a domain")
    .option("-f, --force", "Skip confirmation")
    .action(async (projectId, domainId, options) => {
      requireAuth();
      try {
        if (!options.force) {
          const { confirm } = await inquirer.prompt([
            {
              type: "confirm",
              name: "confirm",
              message: `Are you sure you want to delete domain ${domainId}?`,
              default: false,
            },
          ]);

          if (!confirm) {
            log(chalk.gray("Cancelled"));
            return;
          }
        }

        const spinner = ora("Deleting domain...").start();

        try {
          await apiClient.delete(`/projects/${projectId}/domains/${domainId}`);
          spinner.succeed("Domain deleted successfully");
        } catch (err) {
          spinner.fail("Failed to delete domain");
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