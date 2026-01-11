import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error" | "info";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
          {
            "bg-card-hover text-foreground-secondary border border-border":
              variant === "default",
            "bg-green-500/20 text-green-400 border border-green-500/30":
              variant === "success",
            "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30":
              variant === "warning",
            "bg-red-500/20 text-red-400 border border-red-500/30":
              variant === "error",
            "bg-accent/20 text-accent border border-accent/30":
              variant === "info",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };