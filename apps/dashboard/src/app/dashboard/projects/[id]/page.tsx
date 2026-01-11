"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Rocket, Loader2, ExternalLink, GitBranch, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient, ApiError } from "@/lib/api-client";
import type { Project, Deployment, Domain, EnvVar } from "@kinetix/shared";
import { formatRelativeTime, formatDate } from "@/lib/utils";
import { DeploymentsTab } from "@/components/projects/deployments-tab";
import { DomainsTab } from "@/components/projects/domains-tab";
import { EnvVarsTab } from "@/components/projects/env-vars-tab";

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      const data = await apiClient.get<Project>(`/projects/${projectId}`);
      setProject(data);
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

  if (!project) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-foreground-secondary">Project not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
              {project.gitProvider && (
                <Badge variant="info">{project.gitProvider}</Badge>
              )}
            </div>
            {project.description && (
              <p className="mt-2 text-foreground-secondary">{project.description}</p>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm">
          <ExternalLink className="mr-2 h-4 w-4" />
          View Settings
        </Button>
      </div>

      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>Project information and configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-foreground-secondary">Git Repository</p>
              <p className="text-sm font-medium text-foreground">
                {project.gitRepoUrl ? (
                  <a
                    href={project.gitRepoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    {project.gitRepoUrl}
                  </a>
                ) : (
                  <span className="text-foreground-muted">Not connected</span>
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-foreground-secondary">Branch</p>
              <div className="flex items-center space-x-2">
                <GitBranch className="h-4 w-4 text-foreground-muted" />
                <p className="text-sm font-mono font-medium text-foreground">
                  {project.gitBranch}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-foreground-secondary">Created</p>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-foreground-muted" />
                <p className="text-sm text-foreground">{formatDate(project.createdAt)}</p>
              </div>
            </div>
            {project.framework && (
              <div className="space-y-1">
                <p className="text-sm text-foreground-secondary">Framework</p>
                <p className="text-sm font-medium text-foreground">{project.framework}</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm text-foreground-secondary">Root Directory</p>
              <p className="text-sm font-mono font-medium text-foreground">
                {project.rootDirectory}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-foreground-secondary">Last Updated</p>
              <p className="text-sm text-foreground">{formatRelativeTime(project.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="environment">Environment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Rocket className="h-12 w-12 text-foreground-muted mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Project Overview
              </h3>
              <p className="text-sm text-foreground-secondary text-center max-w-md">
                View deployments, domains, and environment variables in their respective tabs
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployments">
          <DeploymentsTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="domains">
          <DomainsTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="environment">
          <EnvVarsTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}