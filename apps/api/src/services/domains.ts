import crypto from "crypto";
import { db, domains, projects } from "@kinetix/db";
import { eq, and, sql } from "drizzle-orm";
import { generateId, type AddDomainInput, FUNCTION_LIMITS } from "@kinetix/shared";
import { notFound, conflict, badRequest } from "../middleware/error-handler";

export async function addDomain(
  projectId: string,
  userId: string,
  input: AddDomainInput
) {
  // Verify project ownership
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, userId)),
  });

  if (!project) {
    notFound("Project");
  }

  // Check domain limit
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(domains)
    .where(eq(domains.projectId, projectId));

  if (Number(countResult?.count || 0) >= FUNCTION_LIMITS.maxDomainsPerProject) {
    badRequest(
      `Maximum of ${FUNCTION_LIMITS.maxDomainsPerProject} domains per project`
    );
  }

  // Check if domain is already registered
  const existingDomain = await db.query.domains.findFirst({
    where: eq(domains.domain, input.domain.toLowerCase()),
  });

  if (existingDomain) {
    conflict("Domain is already registered");
  }

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const [domain] = await db
    .insert(domains)
    .values({
      id: generateId("dom"),
      projectId,
      domain: input.domain.toLowerCase(),
      status: "pending",
      sslStatus: "pending",
      verificationToken,
    })
    .returning();

  return domain;
}

export async function getDomainById(
  domainId: string,
  projectId: string,
  userId: string
) {
  // Verify project ownership
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, userId)),
  });

  if (!project) {
    notFound("Project");
  }

  const domain = await db.query.domains.findFirst({
    where: and(eq(domains.id, domainId), eq(domains.projectId, projectId)),
  });

  if (!domain) {
    notFound("Domain");
  }

  return domain;
}

export async function listDomains(projectId: string, userId: string) {
  // Verify project ownership
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, userId)),
  });

  if (!project) {
    notFound("Project");
  }

  return db.query.domains.findMany({
    where: eq(domains.projectId, projectId),
  });
}

export async function verifyDomain(
  domainId: string,
  projectId: string,
  userId: string
) {
  const domain = await getDomainById(domainId, projectId, userId);

  if (domain.status === "verified") {
    return domain;
  }

  // Update status to verifying
  await db
    .update(domains)
    .set({
      status: "verifying",
      updatedAt: new Date(),
    })
    .where(eq(domains.id, domainId));

  // TODO: Perform actual DNS verification
  // For now, we'll simulate success
  const verified = await performDnsVerification(
    domain.domain,
    domain.verificationToken!
  );

  const newStatus = verified ? "verified" : "failed";
  const newSslStatus = verified ? "provisioning" : "pending";

  const [updated] = await db
    .update(domains)
    .set({
      status: newStatus,
      sslStatus: newSslStatus,
      updatedAt: new Date(),
    })
    .where(eq(domains.id, domainId))
    .returning();

  // TODO: If verified, provision SSL certificate

  return updated;
}

export async function deleteDomain(
  domainId: string,
  projectId: string,
  userId: string
) {
  // Verify ownership
  await getDomainById(domainId, projectId, userId);

  // TODO: Remove from edge routing, revoke SSL

  await db.delete(domains).where(eq(domains.id, domainId));
}

// Simulated DNS verification
async function performDnsVerification(
  domain: string,
  _token: string
): Promise<boolean> {
  // In production, this would:
  // 1. Look up TXT record at _kinetix.{domain}
  // 2. Compare with expected token
  // 3. Return true if matches

  // For development, return true after a delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return true;
}

export function getDnsVerificationInstructions(
  domain: string,
  token: string
): { type: string; host: string; value: string } {
  return {
    type: "TXT",
    host: `_kinetix.${domain}`,
    value: `kinetix-verification=${token}`,
  };
}
