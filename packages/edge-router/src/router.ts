import { db, functions, domains, projects } from "@kinetix/db";
import { eq, and } from "drizzle-orm";
import type { RouteResult } from "./types";

/**
 * Router for handling domain and function routing
 */
export class FunctionRouter {
  /**
   * Route an incoming request to a function
   */
  async routeRequest(
    hostname: string,
    path: string,
    method: string
  ): Promise<RouteResult> {
    // Extract domain from hostname
    const domainName = this.extractDomain(hostname);
    if (!domainName) {
      return {
        found: false,
        error: {
          code: "NOT_FOUND",
          message: "Invalid hostname",
        },
      };
    }

    // Find domain in database
    const domainResult = await db
      .select()
      .from(domains)
      .where(eq(domains.domain, domainName))
      .limit(1);

    if (domainResult.length === 0) {
      return {
        found: false,
        error: {
          code: "NOT_FOUND",
          message: `Domain ${domainName} not found`,
        },
      };
    }

    const domain = domainResult[0];

    // Check if domain is verified
    if (domain.status !== "verified") {
      return {
        found: false,
        error: {
          code: "DOMAIN_NOT_VERIFIED",
          message: `Domain ${domainName} is not verified`,
        },
      };
    }

    // Get project for this domain
    const projectResult = await db
      .select()
      .from(projects)
      .where(eq(projects.id, domain.projectId))
      .limit(1);

    if (projectResult.length === 0) {
      return {
        found: false,
        error: {
          code: "NOT_FOUND",
          message: "Project not found",
        },
      };
    }

    const project = projectResult[0];

    // Find function that matches the path
    const functionResult = await db
      .select()
      .from(functions)
      .where(
        and(
          eq(functions.projectId, project.id),
          eq(functions.path, path)
        )
      )
      .limit(1);

    if (functionResult.length === 0) {
      return {
        found: false,
        error: {
          code: "NOT_FOUND",
          message: `Function not found for path ${path}`,
        },
      };
    }

    const func = functionResult[0];

    return {
      found: true,
      function: {
        id: func.id,
        path: func.path,
        handler: func.handler,
        context: {
          functionId: func.id,
          deploymentId: func.deploymentId,
          projectId: func.projectId,
          runtime: func.runtime,
          environment: "production", // TODO: Support preview environments
          memory: func.memory,
          timeout: func.timeout,
        },
      },
      domain: {
        id: domain.id,
        name: domain.domain,
        verified: domain.status === "verified",
      },
    };
  }

  /**
   * Extract domain name from hostname
   * Handles subdomains like www.example.com -> example.com
   */
  private extractDomain(hostname: string): string | null {
    // Remove port if present
    const host = hostname.split(":")[0];

    // Handle localhost and IP addresses
    if (host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      return null;
    }

    // For kinetix.run deployments, extract the subdomain
    if (host.endsWith(".kinetix.run")) {
      const subdomain = host.replace(".kinetix.run", "");
      return subdomain + ".kinetix.run";
    }

    // For custom domains, return as-is
    return host;
  }

  /**
   * Get all functions for a project
   */
  async getProjectFunctions(projectId: string): Promise<any[]> {
    return await db
      .select()
      .from(functions)
      .where(eq(functions.projectId, projectId));
  }

  /**
   * Get all domains for a project
   */
  async getProjectDomains(projectId: string): Promise<any[]> {
    return await db
      .select()
      .from(domains)
      .where(eq(domains.projectId, projectId));
  }
}