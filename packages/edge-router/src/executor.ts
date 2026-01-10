import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import type {
  FunctionInvocation,
  ExecutionResult,
  FunctionInstance,
  FunctionCache,
} from "./types";

/**
 * Function executor for running serverless functions
 */
export class FunctionExecutor {
  private cache = new Map<string, FunctionCache>();
  private instances = new Map<string, FunctionInstance>();
  private maxConcurrency = 10;
  private coldStartTimeout = 30000; // 30 seconds
  private warmTimeout = 300000; // 5 minutes

  /**
   * Execute a function invocation
   */
  async execute(invocation: FunctionInvocation): Promise<ExecutionResult> {
    const startTime = Date.now();
    const functionId = invocation.context.functionId;

    try {
      // Check if function is cached
      const cached = this.cache.get(functionId);
      let instance: FunctionInstance | undefined;

      if (cached && this.isCacheValid(cached)) {
        instance = cached.instance;
        cached.lastAccessed = new Date();
      }

      const coldStart = !instance;
      const logs: string[] = [];

      if (coldStart) {
        // Cold start - create new instance
        logs.push(`[COLD START] Creating instance for function ${functionId}`);
        instance = await this.createInstance(invocation, logs);
        this.instances.set(functionId, instance);

        // Update cache
        this.cache.set(functionId, {
          functionId,
          deploymentId: invocation.context.deploymentId,
          lastAccessed: new Date(),
          instance,
          warmTime: Date.now(),
        });
      } else {
        logs.push(`[WARM START] Using cached instance for function ${functionId}`);
        instance.lastRequest = new Date();
        instance.requestCount++;
      }

      // Execute the function
      const result = await this.invokeFunction(instance, invocation, logs);

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        response: result,
        logs,
        metrics: {
          coldStart,
          executionTime,
          memoryUsed: 0, // TODO: Implement memory tracking
          cpuTime: executionTime,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        success: false,
        error: {
          type: "runtime",
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        logs: [`[ERROR] ${error instanceof Error ? error.message : String(error)}`],
        metrics: {
          coldStart: !this.cache.has(functionId),
          executionTime,
        },
      };
    }
  }

  /**
   * Create a new function instance
   */
  private async createInstance(
    invocation: FunctionInvocation,
    logs: string[]
  ): Promise<FunctionInstance> {
    const { context } = invocation;
    const artifactPath = await this.getArtifactPath(context.deploymentId);

    // Extract artifact to temporary directory
    const instanceDir = path.join(
      process.cwd(),
      "tmp",
      "instances",
      context.functionId
    );

    await fs.mkdir(instanceDir, { recursive: true });

    // TODO: Extract artifact
    logs.push(`[INSTANCE] Created instance directory: ${instanceDir}`);

    // Start the function process
    const instance: FunctionInstance = {
      functionId: context.functionId,
      deploymentId: context.deploymentId,
      runtime: context.runtime,
      startedAt: new Date(),
      lastRequest: new Date(),
      requestCount: 0,
    };

    // TODO: Actually start the process based on runtime
    logs.push(`[INSTANCE] Function instance created for ${context.runtime}`);

    return instance;
  }

  /**
   * Invoke function on an instance
   */
  private async invokeFunction(
    instance: FunctionInstance,
    invocation: FunctionInvocation,
    logs: string[]
  ): Promise<any> {
    const { request, envVars } = invocation;

    logs.push(`[INVOKE] ${request.method} ${request.url}`);

    // TODO: Actually invoke the function
    // For now, return a mock response
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: "Function executed successfully",
        functionId: instance.functionId,
        timestamp: new Date().toISOString(),
      }),
      executionTime: 50, // Mock execution time
    };
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(cache: FunctionCache): boolean {
    const now = Date.now();
    const timeSinceAccess = now - cache.lastAccessed.getTime();
    return timeSinceAccess < this.warmTimeout;
  }

  /**
   * Get artifact path for deployment
   */
  private async getArtifactPath(deploymentId: string): Promise<string> {
    // TODO: Get actual artifact path from storage
    return path.join(process.cwd(), "tmp", "artifacts", `${deploymentId}.tar.gz`);
  }

  /**
   * Clean up expired instances
   */
  async cleanup(): Promise<void> {
    const now = Date.now();

    for (const [functionId, cache] of this.cache.entries()) {
      if (!this.isCacheValid(cache)) {
        this.cache.delete(functionId);

        const instance = this.instances.get(functionId);
        if (instance) {
          // TODO: Kill the process
          this.instances.delete(functionId);
        }
      }
    }
  }

  /**
   * Get executor statistics
   */
  getStats(): {
    cachedFunctions: number;
    activeInstances: number;
    totalRequests: number;
  } {
    let totalRequests = 0;

    for (const instance of this.instances.values()) {
      totalRequests += instance.requestCount;
    }

    return {
      cachedFunctions: this.cache.size,
      activeInstances: this.instances.size,
      totalRequests,
    };
  }
}