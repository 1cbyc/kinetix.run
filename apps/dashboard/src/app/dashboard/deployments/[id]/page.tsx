"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Clock, Rocket, GitCommit, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiClient, ApiError } from "@/lib/api-client";
import type { Deployment, DeploymentStatus } from "@kinetix/shared";
import { formatRelativeTime, formatDate } from "@/lib/utils";

const statusConfig: Record<DeploymentStatus, { label: string; variant: "default" | "success" | "warning" | "error" | "info"; icon: typeof CheckCircle2 }> = {
  queued: { label: "Queued", variant: "info", icon: Clock },
  building: { label: "Building", variant: "info", icon: Loader2 },
  deploying: { label: "Deploying", variant: "info", icon: Rocket },
  ready: { label: "Ready", variant: "success", icon: CheckCircle2 },
  failed: { label: "Failed", variant: "error", icon: XCircle },
  cancelled: { label: "Cancelled", variant: "default", icon: XCircle },
};

export default function DeploymentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const deploymentId = params.id as string;

  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [loading, setLoading] = useState(true);
  const [buildLogs, setBuildLogs] = useState<string>("");

  useEffect(() => {
    if (deploymentId) {
      loadDeployment();
    }
  }, [deploymentId]);

  const loadDeployment = async () => {
    try {
      const data = await apiClient.get<Deployment>(`/deployments/${deploymentId}`);
      setDeployment(data);
      
      // Load build logs
      try {
        const logsResponse = await apiClient.get<{ logs: string[]; message?: string }>(
          `/deployments/${deploymentId}/logs`
        );
        setBuildLogs(logsResponse.logs?.join("\n") || logsResponse.message || "");
      } catch (err) {
        // Logs might not be available
        setBuildLogs(data.buildLogs || "");
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push("/login");
      } else if (error instanceof ApiError && error.status === 404) {
        router.push("/dashboard/projects");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-foreground-muted" />
      </div>
    );
  }

  if (!deployment) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" >
          <Link href="/dashboard/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-foreground-secondary">Deployment not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const config = statusConfig[deployment.status];
  const StatusIcon = config.icon;
  const isSpinning = deployment.status === "building" || deployment.status === "deploying";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" >
            <Link href="/dashboard/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <StatusIcon className={`h-6 w-6 ${isSpinning ? "animate-spin" : ""}`} />
              <h1 className="text-3xl font-bold text-foreground">Deployment</h1>
              <Badge variant={config.variant}>{config.label}</Badge>
            </div>
            {deployment.gitMessage && (
              <p className="mt-2 text-foreground-secondary">{deployment.gitMessage}</p>
            )}
          </div>
        </div>
        {deployment.url && (
          <Button variant="outline" size="sm" >
            <a href={deployment.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Site
            </a>
          </Button>
        )}
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment Details</CardTitle>
          <CardDescription>Information about this deployment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {deployment.gitCommit && (
              <div className="space-y-1">
                <p className="text-sm text-foreground-secondary">Commit</p>
                <div className="flex items-center space-x-2">
                  <GitCommit className="h-4 w-4 text-foreground-muted" />
                  <p className="text-sm font-mono font-medium text-foreground">
                    {deployment.gitCommit.substring(0, 7)}
                  </p>
                </div>
              </div>
            )}
            {deployment.gitBranch && (
              <div className="space-y-1">
                <p className="text-sm text-foreground-secondary">Branch</p>
                <p className="text-sm font-medium text-foreground">{deployment.gitBranch}</p>
              </div>
            )}
            {deployment.gitAuthor && (
              <div className="space-y-1">
                <p className="text-sm text-foreground-secondary">Author</p>
                <p className="text-sm font-medium text-foreground">{deployment.gitAuthor}</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm text-foreground-secondary">Environment</p>
              <Badge variant="info">{deployment.environment}</Badge>
            </div>
            {deployment.buildDuration && (
              <div className="space-y-1">
                <p className="text-sm text-foreground-secondary">Build Duration</p>
                <p className="text-sm font-medium text-foreground">
                  {Math.round(deployment.buildDuration / 1000)}s
                </p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm text-foreground-secondary">Created</p>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-foreground-muted" />
                <p className="text-sm text-foreground">{formatDate(deployment.createdAt)}</p>
              </div>
            </div>
            {deployment.readyAt && (
              <div className="space-y-1">
                <p className="text-sm text-foreground-secondary">Ready At</p>
                <p className="text-sm text-foreground">{formatDate(deployment.readyAt)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Build Logs */}
      {buildLogs && (
        <Card>
          <CardHeader>
            <CardTitle>Build Logs</CardTitle>
            <CardDescription>Build output and logs</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-background-secondary rounded-md p-4 text-xs font-mono text-foreground-secondary overflow-x-auto max-h-96 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
              {buildLogs}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}