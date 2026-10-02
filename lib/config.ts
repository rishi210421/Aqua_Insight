import type { IndicatorKey, SystemConfig } from "@/types";

export const DEMO_AS_OF = "2026-10-01";
export const DEMO_SEED = 20261001;

export const DEFAULT_WEIGHTS: Record<IndicatorKey, number> = {
  waterQuality: 0.3,
  biodiversity: 0.25,
  habitat: 0.2,
  citizenSignal: 0.15,
  environmentalContext: 0.1,
};

export const DEFAULT_THRESHOLDS = {
  healthy: 80,
  watch: 60,
};

export const INDICATOR_LABELS: Record<IndicatorKey | "composite", string> = {
  composite: "Composite stream health",
  waterQuality: "Water quality",
  biodiversity: "Biodiversity",
  habitat: "Habitat condition",
  citizenSignal: "Citizen observation signal",
  environmentalContext: "Environmental context",
};

export const INDICATOR_HELP: Record<IndicatorKey, string> = {
  waterQuality:
    "Normalized water-quality indicator derived from appearance, pollution pressure and related measurements (0–100, higher is better).",
  biodiversity:
    "Variety of living organisms observed or indicated at the site, including macroinvertebrate, bird and amphibian signals where available.",
  habitat:
    "Physical habitat condition including vegetation structure and channel/flow context.",
  citizenSignal:
    "Citizen observation signal combining validated reports of water appearance, pollution, vegetation and biodiversity notes.",
  environmentalContext:
    "Supporting environmental context such as rainfall and temperature, used as context rather than a direct health diagnosis.",
};

export const STATUS_LABELS = {
  healthy: "Healthy / Stable",
  watch: "Watch",
  attention: "Attention",
  insufficient: "Insufficient data",
} as const;

export const systemConfig: SystemConfig = {
  weights: DEFAULT_WEIGHTS,
  thresholds: DEFAULT_THRESHOLDS,
  demoAsOf: DEMO_AS_OF,
  isDemo: true,
};
