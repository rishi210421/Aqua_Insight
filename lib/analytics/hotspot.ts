import type { HotspotResult, TrendDirection } from "@/types";

export function detectHotspot(input: {
  score: number | null;
  nearbyAverage: number | null;
  decliningIndicators: number;
  pollutionChange: number | null;
  trend: TrendDirection;
  observationCount: number;
  confidenceLow: boolean;
}): HotspotResult {
  const reasons: string[] = [];

  if (input.observationCount < 6 || input.confidenceLow) {
    return { isHotspot: false, reasons: [] };
  }

  const vsNearby =
    input.score !== null && input.nearbyAverage !== null
      ? input.score - input.nearbyAverage
      : null;

  if (vsNearby !== null && vsNearby <= -12) {
    reasons.push("Composite indicator differs substantially from nearby monitored sites.");
  }
  if (input.decliningIndicators >= 2) {
    reasons.push("Multiple indicators deteriorated over the selected period.");
  }
  if (input.trend === "declining") {
    reasons.push("A negative trend persisted across the comparison window.");
  }
  if (input.pollutionChange !== null && input.pollutionChange >= 12) {
    reasons.push("Pollution-related observations increased.");
  }

  return {
    isHotspot: reasons.length >= 2,
    reasons,
  };
}

export function detectAnomaly(current: number | null, baseline: number | null, z = 1.5) {
  if (current === null || baseline === null) return false;
  const delta = Math.abs(current - baseline);
  return delta >= 12 * z;
}
