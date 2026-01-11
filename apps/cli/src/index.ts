#!/usr/bin/env node

import { Command } from "commander";
import { createAuthCommands } from "./commands/auth.js";
import { createProjectsCommands } from "./commands/projects.js";
import { createDeploymentsCommands } from "./commands/deployments.js";
import { createDomainsCommands } from "./commands/domains.js";
import { createEnvVarsCommands } from "./commands/env-vars.js";
import chalk from "chalk";

const program = new Command();

program
  .name("kinetix")
  .description("CLI tool for Kinetix.run serverless platform")
  .version("0.0.1");

// Register command groups
createAuthCommands(program);
createProjectsCommands(program);
createDeploymentsCommands(program);
createDomainsCommands(program);
createEnvVarsCommands(program);

// Handle errors
program.exitOverride();

try {
  program.parse();
} catch (err: any) {
  console.error(chalk.red("Error:"), err.message || "An error occurred");
  process.exit(1);
}