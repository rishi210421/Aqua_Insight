import { round } from "@/lib/utils";
import type { CompletenessResult, IndicatorSnapshot } from "@/types";

const FIELDS: Array<keyof IndicatorSnapshot> = [
  "waterQuality",
  "biodiversity",
  "habitat",
  "pollution",
  "vegetation",
  "flow",
  "rainfall",
  "temperature",
];

const LABELS: Record<string, string> = {
  waterQuality: "Water quality",
  biodiversity: "Biodiversity",
  habitat: "Habitat",
  pollution: "Pollution observations",
  vegetation: "Vegetation",
  flow: "Flow",
  rainfall: "Weather (rainfall)",
  temperature: "Weather (temperature)",
};

export function calculateDataCompleteness(
  rows: IndicatorSnapshot[],
): CompletenessResult {
  if (!rows.length) {
    return {
      overall: 0,
      byIndicator: Object.fromEntries(FIELDS.map((f) => [LABELS[f], 0])),
      missingFields: Object.values(LABELS),
    };
  }

  const byIndicator: Record<string, number> = {};
  const missingFields: string[] = [];

  for (const field of FIELDS) {
    const present = rows.filter((row) => {
      const v = row[field];
      return typeof v === "number" && Number.isFinite(v);
    }).length;
    const pct = round((present / rows.length) * 100, 0);
    byIndicator[LABELS[field]] = pct;
    if (pct < 100) missingFields.push(LABELS[field]);
  }

  const overall = round(
    Object.values(byIndicator).reduce((a, b) => a + b, 0) / FIELDS.length,
    0,
  );

  return { overall, byIndicator, missingFields };
}
