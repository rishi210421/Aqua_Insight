import { AlertTriangle, CircleHelp, Minus, ShieldCheck } from "lucide-react";
import { STATUS_LABELS } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { HealthStatus } from "@/types";

const icons = {
  healthy: ShieldCheck,
  watch: AlertTriangle,
  attention: AlertTriangle,
  insufficient: CircleHelp,
};

export function StatusBadge({ status, className }: { status: HealthStatus; className?: string }) {
  const Icon = icons[status] ?? Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        status === "healthy" && "bg-healthy/12 text-healthy",
        status === "watch" && "bg-watch/12 text-watch",
        status === "attention" && "bg-attention/12 text-attention",
        status === "insufficient" && "bg-insufficient/12 text-insufficient",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  );
}
