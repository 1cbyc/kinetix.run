"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Globe, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { apiClient, ApiError } from "@/lib/api-client";
import type { Project, Domain } from "@kinetix/shared";

export default function DomainsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await apiClient.get<{
        data: Project[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>("/projects");
      setProjects(response.data);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Domains</h1>
        <p className="mt-2 text-foreground-secondary">
          Manage custom domains across all your projects
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-foreground-muted" />
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-foreground-muted mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Manage domains per project
            </h3>
            <p className="text-sm text-foreground-secondary mb-4 text-center max-w-md">
              Visit a project to manage its domains
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}?tab=domains`}
                  className="text-sm text-accent hover:underline"
                >
                  {project.name}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}