import type { ConfidenceLevel, ConfidenceResult } from "@/types";

export function calculateConfidence(input: {
  observationCount: number;
  indicatorCount: number;
  totalIndicators?: number;
  completeness: number;
  daysSinceLastObservation: number | null;
  historicalDays: number;
  sourceQuality?: number;
  consistency?: number;
}): ConfidenceResult {
  const totalIndicators = input.totalIndicators ?? 5;
  const factors: { label: string; ok: boolean }[] = [];
  let score = 0;

  const recencyOk =
    input.daysSinceLastObservation !== null && input.daysSinceLastObservation <= 21;
  const historyOk = input.historicalDays >= 60;
  const obsOk = input.observationCount >= 12;
  const indicatorsOk = input.indicatorCount >= Math.max(3, Math.ceil(totalIndicators * 0.6));
  const completenessOk = input.completeness >= 70;
  const sourceOk = (input.sourceQuality ?? 80) >= 60;
  const consistencyOk = (input.consistency ?? 70) >= 55;

  factors.push({
    label: `${input.observationCount} observations in the selected period`,
    ok: obsOk,
  });
  factors.push({
    label: `${input.indicatorCount} of ${totalIndicators} indicators available`,
    ok: indicatorsOk,
  });
  factors.push({
    label: `${Math.round(input.completeness)}% data coverage`,
    ok: completenessOk,
  });
  factors.push({
    label:
      input.historicalDays > 0
        ? `${input.historicalDays}-day historical coverage`
        : "Limited history",
    ok: historyOk,
  });
  factors.push({
    label: recencyOk ? "Recent data" : "Stale or missing recent observations",
    ok: recencyOk,
  });
  factors.push({
    label: sourceOk ? "Source quality acceptable for demo analysis" : "Source quality limited",
    ok: sourceOk,
  });
  factors.push({
    label: consistencyOk ? "Indicator series reasonably consistent" : "High variability / inconsistency",
    ok: consistencyOk,
  });

  score += obsOk ? 18 : input.observationCount >= 5 ? 10 : 4;
  score += indicatorsOk ? 18 : input.indicatorCount >= 2 ? 10 : 4;
  score += completenessOk ? 16 : input.completeness >= 40 ? 8 : 3;
  score += historyOk ? 16 : input.historicalDays >= 21 ? 8 : 3;
  score += recencyOk ? 14 : input.daysSinceLastObservation !== null ? 6 : 2;
  score += sourceOk ? 9 : 3;
  score += consistencyOk ? 9 : 3;

  const level: ConfidenceLevel = score >= 78 ? "high" : score >= 52 ? "medium" : "low";

  return { level, score, factors };
}
