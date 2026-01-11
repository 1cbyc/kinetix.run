import { Command } from "commander";
import inquirer from "inquirer";
import { config } from "../lib/config.js";
import { apiClient, ApiError } from "../lib/api-client.js";
import { success, error, log, printTable } from "../lib/output.js";
import { formatRelativeTime, truncate } from "../lib/utils.js";
import chalk from "chalk";
import ora from "ora";
import type { Project } from "@kinetix/shared";

function requireAuth() {
  const token = config.get("accessToken");
  if (!token) {
    error("Not logged in. Run 'kinetix auth login' to login.");
    process.exit(1);
  }
}

export function createProjectsCommands(program: Command) {
  const projects = program
    .command("projects")
    .alias("project")
    .alias("proj")
    .description("Manage projects");

  // List projects
  projects
    .command("list")
    .alias("ls")
    .description("List all projects")
    .action(async () => {
      requireAuth();
      try {
        const spinner = ora("Fetching projects...").start();

        try {
          const response = await apiClient.get<{
            data: Project[];
            pagination: {
              page: number;
              limit: number;
              total: number;
              totalPages: number;
            };
          }>("/projects");

          spinner.succeed();

          if (response.data.length === 0) {
            log(chalk.gray("No projects found. Create one with 'kinetix projects create'"));
            return;
          }

          const tableData = response.data.map((project) => [
            project.name,
            project.slug,
            project.gitBranch || "main",
            project.gitProvider || chalk.gray("—"),
            truncate(project.description || "", 40) || chalk.gray("—"),
            formatRelativeTime(project.updatedAt),
          ]);

          printTable(tableData, [
            "Name",
            "Slug",
            "Branch",
            "Git Provider",
            "Description",
            "Updated",
          ]);

          log("");
          log(chalk.gray(`Total: ${response.pagination.total} project(s)`));
        } catch (err) {
          spinner.fail("Failed to fetch projects");
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

  // Create project
  projects
    .command("create")
    .description("Create a new project")
    .option("-n, --name <name>", "Project name")
    .option("-s, --slug <slug>", "URL slug")
    .option("-d, --description <description>", "Description")
    .option("--git-url <url>", "Git repository URL")
    .option("--branch <branch>", "Git branch", "main")
    .action(async (options) => {
      requireAuth();
      try {
        let name = options.name;
        let slug = options.slug;
        let description = options.description;
        let gitUrl = options.gitUrl;
        let branch = options.branch || "main";

        if (!name) {
          const answers = await inquirer.prompt([
            {
              type: "input",
              name: "name",
              message: "Project name:",
              validate: (input) => (input ? true : "Name is required"),
            },
            {
              type: "input",
              name: "slug",
              message: "URL slug:",
              default: (answers: any) => {
                return answers.name
                  ?.toLowerCase()
                  .replace(/[^a-z0-9-]+/g, "-")
                  .replace(/-+/g, "-")
                  .replace(/^-|-$/g, "");
              },
              validate: (input) => {
                if (!input) return "Slug is required";
                if (!/^[a-z0-9-]+$/.test(input))
                  return "Slug can only contain lowercase letters, numbers, and hyphens";
                return true;
              },
            },
            {
              type: "input",
              name: "description",
              message: "Description (optional):",
            },
            {
              type: "input",
              name: "gitUrl",
              message: "Git repository URL (optional):",
            },
          ]);
          name = answers.name;
          slug = answers.slug;
          description = answers.description;
          gitUrl = answers.gitUrl;
        }

        if (!slug && name) {
          slug = name
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
        }

        if (!slug) {
          error("Slug is required");
          process.exit(1);
        }

        const spinner = ora("Creating project...").start();

        try {
          const project = await apiClient.post<Project>("/projects", {
            name,
            slug,
            description,
            gitRepoUrl: gitUrl,
            gitBranch: branch,
          });

          spinner.succeed("Project created successfully");
          success(`Project '${project.name}' created with ID: ${project.id}`);
        } catch (err) {
          spinner.fail("Failed to create project");
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

  // Get project
  projects
    .command("get <id>")
    .alias("show")
    .description("Get project details")
    .action(async (id) => {
      requireAuth();
      try {
        const spinner = ora("Fetching project...").start();

        try {
          const project = await apiClient.get<Project>(`/projects/${id}`);

          spinner.succeed();

          log("");
          log(chalk.bold("Project Details:"));
          log(`  ID: ${project.id}`);
          log(`  Name: ${project.name}`);
          log(`  Slug: ${project.slug}`);
          if (project.description) {
            log(`  Description: ${project.description}`);
          }
          log(`  Git Branch: ${project.gitBranch}`);
          if (project.gitRepoUrl) {
            log(`  Git URL: ${project.gitRepoUrl}`);
          }
          if (project.gitProvider) {
            log(`  Git Provider: ${project.gitProvider}`);
          }
          if (project.framework) {
            log(`  Framework: ${project.framework}`);
          }
          log(`  Created: ${new Date(project.createdAt).toLocaleString()}`);
          log(`  Updated: ${new Date(project.updatedAt).toLocaleString()}`);
        } catch (err) {
          spinner.fail("Failed to fetch project");
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

  // Delete project
  projects
    .command("delete <id>")
    .alias("rm")
    .description("Delete a project")
    .option("-f, --force", "Skip confirmation")
    .action(async (id, options) => {
      requireAuth();
      try {
        if (!options.force) {
          const { confirm } = await inquirer.prompt([
            {
              type: "confirm",
              name: "confirm",
              message: `Are you sure you want to delete project ${id}?`,
              default: false,
            },
          ]);

          if (!confirm) {
            log(chalk.gray("Cancelled"));
            return;
          }
        }

        const spinner = ora("Deleting project...").start();

        try {
          await apiClient.delete(`/projects/${id}`);
          spinner.succeed("Project deleted successfully");
          success(`Project ${id} has been deleted`);
        } catch (err) {
          spinner.fail("Failed to delete project");
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