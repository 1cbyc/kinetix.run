import { Hono } from "hono";
import { FunctionRouter } from "./router";
import { FunctionExecutor } from "./executor";
import { db, logEntries } from "@kinetix/db";
import type { EdgeRouterConfig } from "./types";

/**
 * Edge Router for Kinetix.run
 * Handles request routing and function execution
 */
export class EdgeRouter {
  private app: Hono;
  private router: FunctionRouter;
  private executor: FunctionExecutor;
  private config: EdgeRouterConfig;

  constructor(config: Partial<EdgeRouterConfig> = {}) {
    this.config = {
      maxConcurrency: 10,
      coldStartTimeout: 30000,
      warmTimeout: 300000,
      maxMemory: 128,
      logLevel: "info",
      enableCaching: true,
      cacheTtl: 300000,
      ...config,
    };

    this.app = new Hono();
    this.router = new FunctionRouter();
    this.executor = new FunctionExecutor();

    this.setupRoutes();
    this.setupCleanup();
  }

  /**
   * Get the Hono app instance
   */
  getApp(): Hono {
    return this.app;
  }

  /**
   * Handle all incoming requests
   */
  private setupRoutes(): void {
    // Health check
    this.app.get("/_health", async (c) => {
      const stats = this.executor.getStats();
      return c.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        stats,
      });
    });

    // Catch-all route for function execution
    this.app.all("*", async (c) => {
      const startTime = Date.now();
      const hostname = c.req.header("host") || "";
      const path = c.req.path;
      const method = c.req.method;

      try {
        // Route the request
        const routeResult = await this.router.routeRequest(hostname, path, method);

        if (!routeResult.found || !routeResult.function) {
          c.status(404);
          return c.json({
            error: routeResult.error?.message || "Not found",
          });
        }

        // Get environment variables
        const envVars = await this.getEnvironmentVariables(
          routeResult.function.context.projectId,
          routeResult.function.context.environment
        );

        // Prepare invocation
        const invocation = {
          context: routeResult.function.context,
          request: {
            method,
            url: c.req.url,
            headers: this.getHeaders(c),
            body: await this.getBody(c),
            query: this.getQueryParams(c),
            params: c.req.param(),
          },
          envVars,
        };

        // Execute function
        const result = await this.executor.execute(invocation);

        // Log the request
        await this.logRequest(
          routeResult.function.context,
          invocation.request,
          result,
          startTime
        );

        if (!result.success || !result.response) {
          c.status(500);
          return c.json({
            error: result.error?.message || "Function execution failed",
          });
        }

        // Return response
        const response = result.response;
        return new Response(
          response.body || null,
          {
            status: response.statusCode,
            headers: response.headers,
          }
        );
      } catch (error) {
        console.error("Edge router error:", error);

        // Log error
        await this.logError(hostname, path, method, error, startTime);

        c.status(500);
        return c.json({
          error: "Internal server error",
        });
      }
    });
  }

  /**
   * Extract headers from request
   */
  private getHeaders(c: any): Record<string, string> {
    const headers: Record<string, string> = {};
    for (const [key, value] of c.req.raw.headers.entries()) {
      headers[key] = value;
    }
    return headers;
  }

  /**
   * Extract body from request
   */
  private async getBody(c: any): Promise<string | undefined> {
    try {
      return await c.req.text();
    } catch {
      return undefined;
    }
  }

  /**
   * Extract query parameters
   */
  private getQueryParams(c: any): Record<string, string> {
    const params: Record<string, string> = {};
    for (const [key, value] of c.req.queries()) {
      params[key] = value;
    }
    return params;
  }

  /**
   * Get environment variables for function
   */
  private async getEnvironmentVariables(
    projectId: string,
    environment: string
  ): Promise<Record<string, string>> {
    // TODO: Fetch from database
    return {
      NODE_ENV: environment,
      KINETIX_PROJECT_ID: projectId,
    };
  }

  /**
   * Log request to database
   */
  private async logRequest(
    context: any,
    request: any,
    result: any,
    startTime: number
  ): Promise<void> {
    try {
      const metadata = {
        projectId: context.projectId,
        duration: Date.now() - startTime,
        statusCode: result.response?.statusCode,
        requestMethod: request.method,
        requestUrl: request.url,
        userAgent: request.headers["user-agent"],
        ipAddress: request.headers["x-forwarded-for"] || request.headers["x-real-ip"],
        coldStart: result.metrics?.coldStart,
        memoryUsed: result.metrics?.memoryUsed,
        logs: result.logs?.join("\n"),
      };

      await db.insert(logEntries).values({
        id: crypto.randomUUID(),
        functionId: context.functionId,
        deploymentId: context.deploymentId,
        level: result.success ? "info" : "error",
        message: result.success ? "Function executed" : result.error?.message,
        metadata: JSON.stringify(metadata),
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Failed to log request:", error);
    }
  }

  /**
   * Log error to database
   * Note: This only logs errors that occur during function execution with valid context
   */
  private async logError(
    hostname: string,
    path: string,
    method: string,
    error: any,
    startTime: number
  ): Promise<void> {
    // For now, just log to console for routing errors without function context
    console.error("Edge router error:", {
      hostname,
      path,
      method,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    });
  }

  /**
   * Setup periodic cleanup
   */
  private setupCleanup(): void {
    setInterval(() => {
      this.executor.cleanup().catch((error) => {
        console.error("Cleanup error:", error);
      });
    }, 60000); // Clean up every minute
  }
}