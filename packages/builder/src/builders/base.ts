import { execa } from "execa";
import type { BuildContext, BuildStep } from "../types";

/**
 * Base class for all runtime builders
 */
export abstract class BaseBuilder {
  protected context: BuildContext;
  protected steps: BuildStep[] = [];

  constructor(context: BuildContext) {
    this.context = context;
  }

  /**
   * Execute a shell command and track it as a build step
   */
  protected async executeStep(
    name: string,
    command: string,
    args: string[] = [],
    options: { cwd?: string; env?: Record<string, string> } = {}
  ): Promise<BuildStep> {
    const step: BuildStep = {
      name,
      command: `${command} ${args.join(" ")}`,
      startTime: new Date(),
      stdout: [],
      stderr: [],
    };

    this.steps.push(step);

    try {
      const result = await execa(command, args, {
        cwd: options.cwd || this.context.workDir,
        env: {
          ...process.env,
          ...this.context.envVars,
          ...options.env,
        },
        all: true,
        reject: false,
      });

      step.exitCode = result.exitCode;
      step.endTime = new Date();

      if (result.stdout) {
        step.stdout = result.stdout.split("\n");
      }
      if (result.stderr) {
        step.stderr = result.stderr.split("\n");
      }

      if (result.exitCode !== 0) {
        throw new Error(
          `Command failed with exit code ${result.exitCode}: ${command} ${args.join(" ")}`
        );
      }

      return step;
    } catch (error) {
      step.endTime = new Date();
      throw error;
    }
  }

  /**
   * Get all logs from build steps
   */
  protected getAllLogs(): string[] {
    const logs: string[] = [];

    for (const step of this.steps) {
      logs.push(`[${step.name}] ${step.command}`);
      logs.push(...step.stdout);
      if (step.stderr.length > 0) {
        logs.push(...step.stderr.map((line) => `[stderr] ${line}`));
      }
      logs.push(
        `[${step.name}] Completed with exit code ${step.exitCode} in ${this.getStepDuration(step)}ms`
      );
      logs.push("");
    }

    return logs;
  }

  /**
   * Calculate step duration in milliseconds
   */
  protected getStepDuration(step: BuildStep): number {
    if (!step.endTime) return 0;
    return step.endTime.getTime() - step.startTime.getTime();
  }

  /**
   * Get total build duration
   */
  protected getTotalDuration(): number {
    if (this.steps.length === 0) return 0;

    const firstStep = this.steps[0];
    const lastStep = this.steps[this.steps.length - 1];

    if (!lastStep.endTime) return 0;

    return lastStep.endTime.getTime() - firstStep.startTime.getTime();
  }
}
