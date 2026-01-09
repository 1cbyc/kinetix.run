import { promises as fs } from "fs";
import path from "path";
import { RuntimeType } from "@kinetix/shared";
import type {
  Builder,
  BuildContext,
  BuildResult,
  BuildFailure,
  FunctionInfo,
} from "../types";
import { BaseBuilder } from "./base";
import { createArtifact, calculateDirectorySize } from "../artifact";

/**
 * Node.js project builder
 */
export class NodeJsBuilder extends BaseBuilder implements Builder {
  runtime = RuntimeType.enum.nodejs20;

  async detect(workDir: string): Promise<boolean> {
    try {
      await fs.access(path.join(workDir, "package.json"));
      return true;
    } catch {
      return false;
    }
  }

  async build(context: BuildContext): Promise<BuildResult | BuildFailure> {
    this.context = context;

    try {
      const startTime = Date.now();

      await this.installDependencies();

      if (context.buildCommand) {
        await this.runBuildCommand(context.buildCommand);
      }

      const outputDir = await this.determineOutputDirectory();
      const functions = await this.detectFunctions(outputDir);

      const artifactPath = await createArtifact(
        context.deploymentId,
        outputDir
      );
      const outputSize = await calculateDirectorySize(outputDir);

      return {
        success: true,
        artifactPath,
        buildDuration: Date.now() - startTime,
        outputSize,
        logs: this.getAllLogs(),
        functions,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        logs: this.getAllLogs(),
        buildDuration: this.getTotalDuration(),
      };
    }
  }

  private async installDependencies(): Promise<void> {
    const packageManager = await this.detectPackageManager();

    switch (packageManager) {
      case "pnpm":
        await this.executeStep("Install dependencies", "pnpm", [
          "install",
          "--frozen-lockfile",
        ]);
        break;
      case "yarn":
        await this.executeStep("Install dependencies", "yarn", [
          "install",
          "--frozen-lockfile",
        ]);
        break;
      case "npm":
      default:
        await this.executeStep("Install dependencies", "npm", ["ci"]);
        break;
    }
  }

  private async detectPackageManager(): Promise<"npm" | "yarn" | "pnpm"> {
    const workDir = this.context.workDir;

    if (await this.fileExists(path.join(workDir, "pnpm-lock.yaml"))) {
      return "pnpm";
    }
    if (await this.fileExists(path.join(workDir, "yarn.lock"))) {
      return "yarn";
    }
    return "npm";
  }

  private async runBuildCommand(command: string): Promise<void> {
    const [cmd, ...args] = command.split(" ");
    await this.executeStep("Build", cmd, args);
  }

  private async determineOutputDirectory(): Promise<string> {
    if (this.context.outputDirectory) {
      return path.join(this.context.workDir, this.context.outputDirectory);
    }

    const possibleDirs = ["dist", "build", ".next", ".output", "out"];

    for (const dir of possibleDirs) {
      const fullPath = path.join(this.context.workDir, dir);
      if (await this.fileExists(fullPath)) {
        return fullPath;
      }
    }

    return this.context.workDir;
  }

  private async detectFunctions(outputDir: string): Promise<FunctionInfo[]> {
    const functions: FunctionInfo[] = [];

    const entries = await fs.readdir(outputDir, { withFileTypes: true });

    for (const entry of entries) {
      if (
        entry.isFile() &&
        (entry.name.endsWith(".js") || entry.name.endsWith(".mjs"))
      ) {
        const functionName = path.basename(entry.name, path.extname(entry.name));
        const relativePath = path.relative(this.context.workDir, path.join(outputDir, entry.name));

        functions.push({
          name: functionName,
          handler: relativePath,
          path: `/${functionName}`,
          runtime: this.runtime,
        });
      }
    }

    return functions;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
