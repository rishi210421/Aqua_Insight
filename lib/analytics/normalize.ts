import { clamp } from "@/lib/utils";

export function normalizeIndicator(
  value: unknown,
  min = 0,
  max = 100,
): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  if (max === min) return null;
  const scaled = ((n - min) / (max - min)) * 100;
  return clamp(scaled, 0, 100);
}

export function invertNormalized(value: number | null) {
  if (value === null) return null;
  return clamp(100 - value, 0, 100);
}

export function safeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}
