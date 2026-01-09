import { tmpdir } from "os";
import path from "path";
import { RuntimeType } from "@kinetix/shared";
import { cloneRepository, cleanupRepository } from "./git";
import { detectRuntime } from "./detector";
import { NodeJsBuilder } from "./builders/nodejs";
import type {
  BuildContext,
  BuildResult,
  BuildFailure,
  GitSource,
  Builder,
} from "./types";

/**
 * Orchestrate the complete build process
 */
export class BuildOrchestrator {
  private builders: Map<RuntimeType, Builder>;

  constructor() {
    this.builders = new Map();
  }

  /**
   * Register a builder for a specific runtime
   */
  registerBuilder(runtime: RuntimeType, builder: Builder): void {
    this.builders.set(runtime, builder);
  }

  /**
   * Execute a complete build from source to artifact
   */
  async build(
    projectId: string,
    deploymentId: string,
    source: GitSource,
    envVars: Record<string, string> = {},
    buildCommand?: string,
    outputDirectory?: string
  ): Promise<BuildResult | BuildFailure> {
    const workDir = path.join(tmpdir(), "kinetix-builds", deploymentId);

    try {
      await cloneRepository(source, workDir);

      const detection = await detectRuntime(workDir);
      if (!detection) {
        return {
          success: false,
          error: "Unable to detect project runtime",
          logs: [],
          buildDuration: 0,
        };
      }

      const context: BuildContext = {
        projectId,
        deploymentId,
        runtime: detection.runtime,
        source,
        workDir,
        envVars,
        buildCommand,
        outputDirectory,
      };

      const builder = this.createBuilder(detection.runtime, context);
      if (!builder) {
        return {
          success: false,
          error: `No builder available for runtime: ${detection.runtime}`,
          logs: [],
          buildDuration: 0,
        };
      }

      const result = await builder.build(context);

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        logs: [],
        buildDuration: 0,
      };
    } finally {
      await cleanupRepository(workDir);
    }
  }

  /**
   * Create a builder instance for a runtime
   */
  private createBuilder(
    runtime: RuntimeType,
    context: BuildContext
  ): Builder | null {
    if (
      runtime === RuntimeType.enum.nodejs18 ||
      runtime === RuntimeType.enum.nodejs20 ||
      runtime === RuntimeType.enum.nodejs22
    ) {
      return new NodeJsBuilder(context);
    }

    return null;
  }
}
