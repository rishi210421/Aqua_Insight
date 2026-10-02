import { DEFAULT_WEIGHTS } from "@/lib/config";
import { round } from "@/lib/utils";
import { statusFromScore } from "@/lib/analytics/status";
import type { CompositeResult, IndicatorComponents, IndicatorKey } from "@/types";

const KEYS: IndicatorKey[] = [
  "waterQuality",
  "biodiversity",
  "habitat",
  "citizenSignal",
  "environmentalContext",
];

export function calculateCompositeScore(
  components: IndicatorComponents,
  weights: Record<IndicatorKey, number> = DEFAULT_WEIGHTS,
): CompositeResult {
  const missing: IndicatorKey[] = [];
  const available: IndicatorKey[] = [];

  for (const key of KEYS) {
    const value = components[key];
    if (value === null || value === undefined || !Number.isFinite(value)) {
      missing.push(key);
    } else {
      available.push(key);
    }
  }

  if (!available.length) {
    return {
      score: null,
      status: "insufficient",
      usedWeights: {},
      missing,
      redistributionNote:
        "No indicator values were available for this period. A composite score was not calculated.",
    };
  }

  const availableWeight = available.reduce((sum, key) => sum + weights[key], 0);
  if (availableWeight <= 0) {
    return {
      score: null,
      status: "insufficient",
      usedWeights: {},
      missing,
      redistributionNote: "Configured weights for available indicators sum to zero.",
    };
  }

  const usedWeights: Partial<Record<IndicatorKey, number>> = {};
  let score = 0;
  for (const key of available) {
    const w = weights[key] / availableWeight;
    usedWeights[key] = round(w, 4);
    score += (components[key] as number) * w;
  }

  const redistributionNote =
    missing.length > 0
      ? `${missing
          .map((k) => label(k))
          .join(", ")} unavailable for this period. Score calculated using remaining indicators with reduced confidence.`
      : null;

  const rounded = round(score, 1);
  return {
    score: rounded,
    status: statusFromScore(rounded),
    usedWeights,
    missing,
    redistributionNote,
  };
}

function label(key: IndicatorKey) {
  switch (key) {
    case "waterQuality":
      return "Water-quality data";
    case "biodiversity":
      return "Biodiversity data";
    case "habitat":
      return "Habitat data";
    case "citizenSignal":
      return "Citizen observation signal";
    case "environmentalContext":
      return "Environmental context";
  }
}

export function deriveCitizenSignal(input: {
  pollution: number | null;
  vegetation: number | null;
  biodiversity: number | null;
  flow: number | null;
}): number | null {
  const parts: number[] = [];
  if (input.pollution !== null) parts.push(100 - input.pollution);
  if (input.vegetation !== null) parts.push(input.vegetation);
  if (input.biodiversity !== null) parts.push(input.biodiversity);
  if (input.flow !== null) parts.push(input.flow);
  if (!parts.length) return null;
  return round(parts.reduce((a, b) => a + b, 0) / parts.length, 1);
}

export function deriveEnvironmentalContext(input: {
  rainfall: number | null;
  temperature: number | null;
}): number | null {
  const parts: number[] = [];
  if (input.rainfall !== null) {
    const deviation = Math.abs(input.rainfall - 50);
    parts.push(Math.max(0, 100 - deviation * 1.4));
  }
  if (input.temperature !== null) {
    const deviation = Math.abs(input.temperature - 18);
    parts.push(Math.max(0, 100 - deviation * 3.5));
  }
  if (!parts.length) return null;
  return round(parts.reduce((a, b) => a + b, 0) / parts.length, 1);
}
