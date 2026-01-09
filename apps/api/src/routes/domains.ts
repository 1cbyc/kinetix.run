import { Hono } from "hono";
import { AddDomainSchema } from "@kinetix/shared";
import {
  addDomain,
  getDomainById,
  listDomains,
  verifyDomain,
  deleteDomain,
  getDnsVerificationInstructions,
} from "../services/domains";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types";

type DomainEnv = AppEnv & {
  Variables: AppEnv["Variables"] & { projectId: string };
};

export const domainRoutes = new Hono<DomainEnv>();

// All domain routes require authentication
domainRoutes.use("*", requireAuth);

// List domains
domainRoutes.get("/", async (c) => {
  const userId = c.get("userId")!;
  const projectId = c.req.param("projectId") as string;

  const domainsList = await listDomains(projectId, userId);

  return c.json({
    success: true,
    data: domainsList,
  });
});

// Add domain
domainRoutes.post("/", async (c) => {
  const userId = c.get("userId")!;
  const projectId = c.req.param("projectId") as string;
  const body = await c.req.json();
  const input = AddDomainSchema.parse(body);

  const domain = await addDomain(projectId, userId, input);

  // Include verification instructions in response
  const instructions = getDnsVerificationInstructions(
    domain.domain,
    domain.verificationToken!
  );

  return c.json(
    {
      success: true,
      data: {
        ...domain,
        verification: instructions,
      },
    },
    201
  );
});

// Get domain
domainRoutes.get("/:domainId", async (c) => {
  const userId = c.get("userId")!;
  const projectId = c.req.param("projectId") as string;
  const domainId = c.req.param("domainId") as string;

  const domain = await getDomainById(domainId, projectId, userId);

  // Include verification instructions if not verified
  let verification;
  if (domain.status !== "verified" && domain.verificationToken) {
    verification = getDnsVerificationInstructions(
      domain.domain,
      domain.verificationToken
    );
  }

  return c.json({
    success: true,
    data: {
      ...domain,
      verification,
    },
  });
});

// Verify domain
domainRoutes.post("/:domainId/verify", async (c) => {
  const userId = c.get("userId")!;
  const projectId = c.req.param("projectId") as string;
  const domainId = c.req.param("domainId") as string;

  const domain = await verifyDomain(domainId, projectId, userId);

  return c.json({
    success: true,
    data: domain,
  });
});

// Delete domain
domainRoutes.delete("/:domainId", async (c) => {
  const userId = c.get("userId")!;
  const projectId = c.req.param("projectId") as string;
  const domainId = c.req.param("domainId") as string;

  await deleteDomain(domainId, projectId, userId);

  return c.json({
    success: true,
    data: { message: "Domain removed" },
  });
});
