import { DEFAULT_THRESHOLDS } from "@/lib/config";
import type { HealthStatus } from "@/types";

export function statusFromScore(
  score: number | null,
  thresholds = DEFAULT_THRESHOLDS,
): HealthStatus {
  if (score === null || !Number.isFinite(score)) return "insufficient";
  if (score >= thresholds.healthy) return "healthy";
  if (score >= thresholds.watch) return "watch";
  return "attention";
}
