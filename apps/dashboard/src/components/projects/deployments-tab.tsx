"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Rocket, Plus, Loader2, CheckCircle2, XCircle, Clock, GitCommit, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient, ApiError } from "@/lib/api-client";
import type { Deployment, DeploymentStatus } from "@kinetix/shared";
import { formatRelativeTime } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeploymentsTabProps {
  projectId: string;
}

const statusConfig: Record<DeploymentStatus, { label: string; variant: "default" | "success" | "warning" | "error" | "info"; icon: typeof CheckCircle2 }> = {
  queued: { label: "Queued", variant: "info", icon: Clock },
  building: { label: "Building", variant: "info", icon: Loader2 },
  deploying: { label: "Deploying", variant: "info", icon: Rocket },
  ready: { label: "Ready", variant: "success", icon: CheckCircle2 },
  failed: { label: "Failed", variant: "error", icon: XCircle },
  cancelled: { label: "Cancelled", variant: "default", icon: XCircle },
};

export function DeploymentsTab({ projectId }: DeploymentsTabProps) {
  const router = useRouter();
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [deploying, setDeploying] = useState(false);

  useEffect(() => {
    loadDeployments();
  }, [projectId]);

  const loadDeployments = async () => {
    try {
      const response = await apiClient.get<{
        data: Deployment[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>(`/projects/${projectId}/deployments`);
      setDeployments(response.data);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDeploying(true);

    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        gitBranch: formData.get("gitBranch")?.toString() || undefined,
        gitCommit: formData.get("gitCommit")?.toString() || undefined,
        environment: formData.get("environment")?.toString() || "preview",
      };

      await apiClient.post(`/projects/${projectId}/deployments`, data);
      setDeployModalOpen(false);
      loadDeployments();
    } catch (error) {
      console.error("Failed to deploy:", error);
    } finally {
      setDeploying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-foreground-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Deployments</h3>
          <p className="text-sm text-foreground-secondary">
            Deploy your project from Git
          </p>
        </div>
        <Button onClick={() => setDeployModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Deploy
        </Button>
      </div>

      {deployments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Rocket className="h-12 w-12 text-foreground-muted mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No deployments yet
            </h3>
            <p className="text-sm text-foreground-secondary mb-4 text-center max-w-md">
              Create your first deployment to get started
            </p>
            <Button onClick={() => setDeployModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Deploy Now
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {deployments.map((deployment) => {
            const config = statusConfig[deployment.status];
            const StatusIcon = config.icon;
            const isSpinning = deployment.status === "building" || deployment.status === "deploying";

            return (
              <Link
                key={deployment.id}
                href={`/dashboard/deployments/${deployment.id}`}
              >
                <Card className="hover:border-border-light hover:bg-card-hover transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`flex items-center space-x-2 ${isSpinning ? "animate-spin" : ""}`}>
                          <StatusIcon className={`h-5 w-5 ${isSpinning ? "animate-spin" : ""}`} />
                          <Badge variant={config.variant}>{config.label}</Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            {deployment.gitCommit && (
                              <>
                                <GitCommit className="h-4 w-4 text-foreground-muted" />
                                <span className="text-sm font-mono text-foreground">
                                  {deployment.gitCommit.substring(0, 7)}
                                </span>
                              </>
                            )}
                            {deployment.gitBranch && (
                              <span className="text-sm text-foreground-secondary">
                                ({deployment.gitBranch})
                              </span>
                            )}
                          </div>
                          {deployment.gitMessage && (
                            <p className="text-sm text-foreground-secondary mt-1 truncate">
                              {deployment.gitMessage}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-foreground-secondary">
                            {formatRelativeTime(deployment.createdAt)}
                          </p>
                          {deployment.url && (
                            <a
                              href={deployment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center space-x-1 text-sm text-accent hover:underline mt-1"
                            >
                              <span>View</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <Modal
        open={deployModalOpen}
        onClose={() => setDeployModalOpen(false)}
        title="Create Deployment"
        description="Deploy your project from Git"
      >
        <form onSubmit={handleDeploy} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gitBranch">Branch</Label>
            <Input
              id="gitBranch"
              name="gitBranch"
              type="text"
              placeholder="main"
              defaultValue="main"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gitCommit">Commit SHA (optional)</Label>
            <Input
              id="gitCommit"
              name="gitCommit"
              type="text"
              placeholder="Leave empty for latest"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="environment">Environment</Label>
            <select
              id="environment"
              name="environment"
              className="flex h-10 w-full rounded-md border border-border bg-background-secondary px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              defaultValue="preview"
            >
              <option value="preview">Preview</option>
              <option value="production">Production</option>
              <option value="development">Development</option>
            </select>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeployModalOpen(false)}
              disabled={deploying}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={deploying}>
              {deploying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deploying...
                </>
              ) : (
                "Deploy"
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}