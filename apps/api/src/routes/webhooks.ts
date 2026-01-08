import crypto from "crypto";
import { Hono } from "hono";
import { db, projects, gitInstallations } from "@kinetix/db";
import { eq, and } from "drizzle-orm";
import { createDeployment } from "../services/deployments";
import type { GitHubWebhookPayload } from "@kinetix/shared";

export const webhookRoutes = new Hono();

// GitHub webhook
webhookRoutes.post("/github", async (c) => {
  const signature = c.req.header("x-hub-signature-256");
  const event = c.req.header("x-github-event");
  const deliveryId = c.req.header("x-github-delivery");

  const rawBody = await c.req.text();

  // Verify webhook signature
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (secret && signature) {
    const hmac = crypto.createHmac("sha256", secret);
    const digest = "sha256=" + hmac.update(rawBody).digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
      return c.json({ error: "Invalid signature" }, 401);
    }
  }

  const payload: GitHubWebhookPayload = JSON.parse(rawBody);

  console.log(`GitHub webhook: ${event} (${deliveryId})`);

  // Handle push events
  if (event === "push") {
    await handleGitHubPush(payload);
  }

  return c.json({ received: true });
});

async function handleGitHubPush(payload: GitHubWebhookPayload) {
  const repoId = payload.repository.id.toString();
  const branch = payload.ref.replace("refs/heads/", "");
  const commit = payload.after;
  const message = payload.head_commit?.message || "";
  const author = payload.head_commit?.author.name || payload.pusher.name;

  // Find project linked to this repo
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.gitRepoId, repoId),
      eq(projects.gitProvider, "github")
    ),
  });

  if (!project) {
    console.log(`No project found for GitHub repo ${repoId}`);
    return;
  }

  // Determine environment based on branch
  const environment =
    branch === project.gitBranch ? "production" : "preview";

  // Create deployment
  console.log(
    `Creating ${environment} deployment for ${project.name} from ${branch}`
  );

  // Note: We use a system context here since webhooks bypass user auth
  // In production, you'd have proper service-level authentication
  await db.transaction(async (tx) => {
    // Get project owner
    const [deployment] = await tx
      .insert(require("@kinetix/db").deployments)
      .values({
        id: require("@kinetix/shared").generateId("dpl"),
        projectId: project.id,
        status: "queued",
        environment,
        gitCommit: commit,
        gitBranch: branch,
        gitMessage: message.slice(0, 500),
        gitAuthor: author,
      })
      .returning();

    console.log(`Deployment ${deployment.id} queued`);

    // TODO: Queue build job
  });
}

// GitLab webhook
webhookRoutes.post("/gitlab", async (c) => {
  const token = c.req.header("x-gitlab-token");

  // Verify token
  const secret = process.env.GITLAB_WEBHOOK_SECRET;
  if (secret && token !== secret) {
    return c.json({ error: "Invalid token" }, 401);
  }

  const payload = await c.req.json();
  const event = payload.object_kind;

  console.log(`GitLab webhook: ${event}`);

  if (event === "push") {
    // TODO: Handle GitLab push similar to GitHub
  }

  return c.json({ received: true });
});

// Bitbucket webhook
webhookRoutes.post("/bitbucket", async (c) => {
  // Bitbucket uses IP allowlisting + optional secrets
  const payload = await c.req.json();
  const event = c.req.header("x-event-key");

  console.log(`Bitbucket webhook: ${event}`);

  if (event === "repo:push") {
    // TODO: Handle Bitbucket push
  }

  return c.json({ received: true });
});
