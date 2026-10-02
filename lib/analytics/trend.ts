import { round } from "@/lib/utils";
import type { TrendDirection, TrendResult } from "@/types";

export function calculatePercentageChange(current: number | null, previous: number | null) {
  if (current === null || previous === null) return null;
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) {
    if (current === 0) return 0;
    return null;
  }
  return round(((current - previous) / Math.abs(previous)) * 100, 1);
}

export function calculateTrend(
  currentValues: Array<number | null | undefined>,
  previousValues: Array<number | null | undefined>,
  options?: { minPoints?: number },
): TrendResult {
  const minPoints = options?.minPoints ?? 2;
  const currentNums = currentValues.filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v),
  );
  const previousNums = previousValues.filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v),
  );

  if (currentNums.length < minPoints || previousNums.length < minPoints) {
    return {
      current: currentNums.length ? round(avg(currentNums), 1) : null,
      previous: previousNums.length ? round(avg(previousNums), 1) : null,
      absoluteChange: null,
      percentChange: null,
      direction: "insufficient",
      note: "Not enough data to establish a reliable trend.",
    };
  }

  const current = round(avg(currentNums), 1);
  const previous = round(avg(previousNums), 1);
  const absoluteChange = round(current - previous, 1);
  const percentChange = calculatePercentageChange(current, previous);
  const direction = directionFromChange(percentChange);

  return {
    current,
    previous,
    absoluteChange,
    percentChange,
    direction,
    note: null,
  };
}

export function directionFromChange(percentChange: number | null): TrendDirection {
  if (percentChange === null) return "insufficient";
  if (percentChange <= -3) return "declining";
  if (percentChange >= 3) return "improving";
  return "stable";
}

function avg(values: number[]) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}
