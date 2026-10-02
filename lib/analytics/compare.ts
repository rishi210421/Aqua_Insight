import type { CompositeResult, ConfidenceLevel, IndicatorComponents } from "@/types";

export interface SiteComparisonRow {
  siteId: string;
  siteName: string;
  composite: number | null;
  components: IndicatorComponents;
  completeness: number;
  confidence: ConfidenceLevel;
  trendPercent: number | null;
}

export function compareSites(rows: SiteComparisonRow[]) {
  const scores = rows
    .map((r) => r.composite)
    .filter((v): v is number => v !== null);
  const max = scores.length ? Math.max(...scores) : null;
  const min = scores.length ? Math.min(...scores) : null;
  const spread = max !== null && min !== null ? max - min : null;

  return {
    rows,
    spread,
    highestId: rows.find((r) => r.composite === max)?.siteId ?? null,
    lowestId: rows.find((r) => r.composite === min)?.siteId ?? null,
  };
}

export function compositeDelta(a: CompositeResult, b: CompositeResult) {
  if (a.score === null || b.score === null) return null;
  return a.score - b.score;
}
