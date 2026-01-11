"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Plus, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient, ApiError } from "@/lib/api-client";
import type { Domain, DomainStatus } from "@kinetix/shared";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DomainsTabProps {
  projectId: string;
}

const statusConfig: Record<DomainStatus, { label: string; variant: "default" | "success" | "warning" | "error" | "info"; icon: typeof CheckCircle2 }> = {
  pending: { label: "Pending", variant: "info", icon: Clock },
  verifying: { label: "Verifying", variant: "info", icon: Clock },
  verified: { label: "Verified", variant: "success", icon: CheckCircle2 },
  failed: { label: "Failed", variant: "error", icon: XCircle },
};

export function DomainsTab({ projectId }: DomainsTabProps) {
  const router = useRouter();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadDomains();
  }, [projectId]);

  const loadDomains = async () => {
    try {
      const data = await apiClient.get<Domain[]>(`/projects/${projectId}/domains`);
      setDomains(data);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAdding(true);

    try {
      const formData = new FormData(e.currentTarget);
      const domain = formData.get("domain")?.toString();

      if (!domain) return;

      await apiClient.post(`/projects/${projectId}/domains`, { domain });
      setAddModalOpen(false);
      loadDomains();
    } catch (error) {
      console.error("Failed to add domain:", error);
    } finally {
      setAdding(false);
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
          <h3 className="text-lg font-semibold text-foreground">Domains</h3>
          <p className="text-sm text-foreground-secondary">
            Manage custom domains for your project
          </p>
        </div>
        <Button onClick={() => setAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Domain
        </Button>
      </div>

      {domains.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-foreground-muted mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No domains yet
            </h3>
            <p className="text-sm text-foreground-secondary mb-4 text-center max-w-md">
              Add a custom domain to your project
            </p>
            <Button onClick={() => setAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Domain
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {domains.map((domain) => {
            const config = statusConfig[domain.status];

            return (
              <Card key={domain.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <Globe className="h-5 w-5 text-foreground-muted" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <p className="text-sm font-medium text-foreground">
                            {domain.domain}
                          </p>
                          <Badge variant={config.variant}>{config.label}</Badge>
                          {domain.sslStatus === "active" && (
                            <Badge variant="success">SSL Active</Badge>
                          )}
                        </div>
                      </div>
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
        title="Add Domain"
        description="Add a custom domain to your project"
      >
        <form onSubmit={handleAddDomain} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              name="domain"
              type="text"
              placeholder="example.com"
              required
            />
            <p className="text-xs text-foreground-muted">
              Enter your domain without http:// or https://
            </p>
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
                "Add Domain"
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}