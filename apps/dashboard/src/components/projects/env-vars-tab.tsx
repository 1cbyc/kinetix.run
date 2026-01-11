"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Key, Plus, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient, ApiError } from "@/lib/api-client";
import type { EnvVar, EnvironmentType } from "@kinetix/shared";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EnvVarsTabProps {
  projectId: string;
}

export function EnvVarsTab({ projectId }: EnvVarsTabProps) {
  const router = useRouter();
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [environment, setEnvironment] = useState<EnvironmentType>("production");

  useEffect(() => {
    loadEnvVars();
  }, [projectId, environment]);

  const loadEnvVars = async () => {
    try {
      const data = await apiClient.get<EnvVar[]>(
        `/projects/${projectId}/env?environment=${environment}`
      );
      setEnvVars(data);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddEnvVar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAdding(true);

    try {
      const formData = new FormData(e.currentTarget);
      const key = formData.get("key")?.toString();
      const value = formData.get("value")?.toString();
      const env = formData.get("environment")?.toString() as EnvironmentType;

      if (!key || !value) return;

      await apiClient.post(`/projects/${projectId}/env`, {
        key,
        value,
        environment: env,
      });
      setAddModalOpen(false);
      loadEnvVars();
    } catch (error) {
      console.error("Failed to add env var:", error);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteEnvVar = async (key: string, env: EnvironmentType) => {
    if (!confirm(`Are you sure you want to delete ${key}?`)) return;

    try {
      await apiClient.delete(`/projects/${projectId}/env/${key}?environment=${env}`);
      loadEnvVars();
    } catch (error) {
      console.error("Failed to delete env var:", error);
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
          <h3 className="text-lg font-semibold text-foreground">Environment Variables</h3>
          <p className="text-sm text-foreground-secondary">
            Manage environment variables for your project
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as EnvironmentType)}
            className="flex h-10 rounded-md border border-border bg-background-secondary px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <option value="production">Production</option>
            <option value="preview">Preview</option>
            <option value="development">Development</option>
          </select>
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Variable
          </Button>
        </div>
      </div>

      {envVars.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Key className="h-12 w-12 text-foreground-muted mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No environment variables
            </h3>
            <p className="text-sm text-foreground-secondary mb-4 text-center max-w-md">
              Add environment variables for {environment} environment
            </p>
            <Button onClick={() => setAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Variable
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {envVars.map((envVar) => {
            return (
              <Card key={envVar.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <Key className="h-5 w-5 text-foreground-muted flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <p className="text-sm font-mono font-medium text-foreground">
                            {envVar.key}
                          </p>
                          <Badge variant="info">{envVar.environment}</Badge>
                        </div>
                        <p className="text-sm text-foreground-secondary mt-1 font-mono">
                          ••••••••
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEnvVar(envVar.key, envVar.environment)}
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Environment Variable"
        description="Add a new environment variable"
      >
        <form onSubmit={handleAddEnvVar} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="key">Key</Label>
            <Input
              id="key"
              name="key"
              type="text"
              placeholder="API_KEY"
              pattern="^[A-Z_][A-Z0-9_]*$"
              required
            />
            <p className="text-xs text-foreground-muted">
              Uppercase letters, numbers, and underscores only
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="value">Value</Label>
            <textarea
              id="value"
              name="value"
              className="flex min-h-[80px] w-full rounded-md border border-border bg-background-secondary px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent resize-none font-mono"
              placeholder="your-secret-value"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="env-environment">Environment</Label>
            <select
              id="env-environment"
              name="environment"
              className="flex h-10 w-full rounded-md border border-border bg-background-secondary px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              defaultValue={environment}
            >
              <option value="production">Production</option>
              <option value="preview">Preview</option>
              <option value="development">Development</option>
            </select>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddModalOpen(false)}
              disabled={adding}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={adding}>
              {adding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Variable"
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}