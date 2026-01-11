"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Rocket, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiClient, ApiError } from "@/lib/api-client";
import type { Deployment, DeploymentStatus } from "@kinetix/shared";
import { formatRelativeTime } from "@/lib/utils";

const statusConfig: Record<DeploymentStatus, { label: string; variant: "default" | "success" | "warning" | "error" | "info"; icon: typeof CheckCircle2 }> = {
  queued: { label: "Queued", variant: "info", icon: Clock },
  building: { label: "Building", variant: "info", icon: Loader2 },
  deploying: { label: "Deploying", variant: "info", icon: Rocket },
  ready: { label: "Ready", variant: "success", icon: CheckCircle2 },
  failed: { label: "Failed", variant: "error", icon: XCircle },
  cancelled: { label: "Cancelled", variant: "default", icon: XCircle },
};

export default function DeploymentsPage() {
  const router = useRouter();
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This would ideally fetch all deployments across projects
    // For now, redirect to projects
    router.push("/dashboard/projects");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-foreground-muted" />
    </div>
  );
}