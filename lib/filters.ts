import { DEMO_AS_OF } from "@/lib/config";
import { addDays } from "@/lib/utils";
import type { AppFilters, DateRangeKey } from "@/types";

export function rangeDays(range: DateRangeKey) {
  switch (range) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "1y":
      return 365;
    default:
      return 30;
  }
}

export function resolveWindow(filters: AppFilters, asOf = DEMO_AS_OF) {
  if (filters.range === "custom" && filters.from && filters.to) {
    const from = filters.from;
    const to = filters.to;
    const ms = new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime();
    const days = Math.max(1, Math.round(ms / 86400000));
    const prevTo = addDays(from, -1);
    const prevFrom = addDays(prevTo, -days);
    return { from, to, prevFrom, prevTo, days };
  }
  const days = rangeDays(filters.range);
  const to = asOf;
  const from = addDays(to, -days);
  const prevTo = addDays(from, -1);
  const prevFrom = addDays(prevTo, -days);
  return { from, to, prevFrom, prevTo, days };
}

export function inRange(date: string, from: string, to: string) {
  return date >= from && date <= to;
}

export function parseFilters(sp: Record<string, string | string[] | undefined>): AppFilters {
  const get = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const range = (get("range") as DateRangeKey) || "30d";
  return {
    country: get("country") || undefined,
    city: get("city") || undefined,
    streamId: get("stream") || undefined,
    siteId: get("site") || undefined,
    range: ["7d", "30d", "90d", "1y", "custom"].includes(range) ? range : "30d",
    from: get("from") || undefined,
    to: get("to") || undefined,
    indicator: (get("indicator") as AppFilters["indicator"]) || "composite",
    status: (get("status") as AppFilters["status"]) || undefined,
    q: get("q") || undefined,
  };
}

export function filtersToQuery(filters: AppFilters) {
  const params = new URLSearchParams();
  if (filters.country) params.set("country", filters.country);
  if (filters.city) params.set("city", filters.city);
  if (filters.streamId) params.set("stream", filters.streamId);
  if (filters.siteId) params.set("site", filters.siteId);
  if (filters.range) params.set("range", filters.range);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.indicator && filters.indicator !== "composite") params.set("indicator", filters.indicator);
  if (filters.status) params.set("status", filters.status);
  if (filters.q) params.set("q", filters.q);
  const s = params.toString();
  return s ? `?${s}` : "";
}
