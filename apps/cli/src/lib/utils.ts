import chalk from "chalk";

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = typeof date === "string" ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(then);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatCommit(commit: string | null | undefined): string {
  if (!commit) return "N/A";
  return commit.substring(0, 7);
}

export function getStatusColor(status: string): (text: string) => string {
  switch (status.toLowerCase()) {
    case "ready":
    case "verified":
    case "active":
      return chalk.green;
    case "building":
    case "deploying":
    case "pending":
    case "verifying":
    case "provisioning":
      return chalk.blue;
    case "failed":
    case "error":
    case "cancelled":
      return chalk.red;
    case "queued":
      return chalk.yellow;
    default:
      return chalk.gray;
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length - 3) + "...";
}