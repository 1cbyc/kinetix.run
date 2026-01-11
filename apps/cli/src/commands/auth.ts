import { Command } from "commander";
import inquirer from "inquirer";
import { config } from "../lib/config.js";
import { apiClient, ApiError } from "../lib/api-client.js";
import { success, error, info, log } from "../lib/output.js";
import chalk from "chalk";
import ora from "ora";

export function createAuthCommands(program: Command) {
  const auth = program.command("auth").description("Authentication commands");

  // Login command
  auth
    .command("login")
    .description("Login to your Kinetix account")
    .option("-e, --email <email>", "Email address")
    .option("-p, --password <password>", "Password")
    .action(async (options) => {
      try {
        let email = options.email;
        let password = options.password;

        if (!email || !password) {
          const answers = await inquirer.prompt([
            {
              type: "input",
              name: "email",
              message: "Email:",
              validate: (input) => (input ? true : "Email is required"),
            },
            {
              type: "password",
              name: "password",
              message: "Password:",
              mask: "*",
              validate: (input) => (input ? true : "Password is required"),
            },
          ]);
          email = answers.email;
          password = answers.password;
        }

        const spinner = ora("Logging in...").start();

        try {
          const response = await apiClient.post<{
            accessToken: string;
            refreshToken: string;
            user: {
              id: string;
              email: string;
              name: string | null;
            };
          }>("/auth/login", { email, password });

          config.set("accessToken", response.accessToken);
          spinner.succeed("Logged in successfully");
          success(`Welcome back, ${response.user.name || response.user.email}!`);
        } catch (err) {
          spinner.fail("Login failed");
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

  // Logout command
  auth
    .command("logout")
    .description("Logout from your Kinetix account")
    .action(async () => {
      try {
        const token = config.get("accessToken");
        if (token) {
          try {
            await apiClient.post("/auth/logout");
          } catch (err) {
            // Continue even if logout request fails
          }
        }
        config.delete("accessToken");
        config.delete("currentProject");
        success("Logged out successfully");
      } catch (err) {
        error("Failed to logout");
        process.exit(1);
      }
    });

  // Whoami command
  auth
    .command("whoami")
    .description("Show current user information")
    .action(async () => {
      try {
        const token = config.get("accessToken");
        if (!token) {
          error("Not logged in. Run 'kinetix auth login' to login.");
          process.exit(1);
        }

        const spinner = ora("Fetching user info...").start();

        try {
          const user = await apiClient.get<{
            id: string;
            email: string;
            name: string | null;
            createdAt: Date;
          }>("/auth/me");

          spinner.succeed();
          log("");
          log(chalk.bold("User Information:"));
          log(`  Email: ${user.email}`);
          if (user.name) {
            log(`  Name: ${user.name}`);
          }
          log(`  ID: ${user.id}`);
        } catch (err) {
          spinner.fail("Failed to fetch user info");
          throw err;
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          error("Not authenticated. Run 'kinetix auth login' to login.");
        } else if (err instanceof ApiError) {
          error(err.message);
        } else {
          error("An unexpected error occurred");
        }
        process.exit(1);
      }
    });
}