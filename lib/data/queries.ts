import {
  calculateCompositeScore,
  calculateConfidence,
  calculateDataCompleteness,
  calculateTrend,
  detectHotspot,
  deriveCitizenSignal,
  deriveEnvironmentalContext,
} from "@/lib/analytics";
import { DEMO_AS_OF, INDICATOR_LABELS } from "@/lib/config";
import { snapshotComponents } from "@/lib/data/seed";
import { getDataset } from "@/lib/data/store";
import { inRange, resolveWindow } from "@/lib/filters";
import { mean, round } from "@/lib/utils";
import type {
  AppFilters,
  IndicatorKey,
  IndicatorSnapshot,
  Site,
  SiteAnalyticsView,
  SpatialContext,
} from "@/types";
import { generateInsightCards, generateStructuredInsight } from "@/lib/insights/deterministic";

export type SiteAnalytics = SiteAnalyticsView;

export function getSources() {
  return getDataset().sources;
}

export function getStreams() {
  return getDataset().streams;
}

export function getSites(filters: Partial<AppFilters> = {}) {
  return getDataset().sites.filter((site) => {
    if (filters.country && site.country !== filters.country) return false;
    if (filters.city && site.city !== filters.city) return false;
    if (filters.streamId && site.streamId !== filters.streamId) return false;
    if (filters.siteId && site.id !== filters.siteId) return false;
    if (filters.q) {
      const q = filters.q.toLowerCase();
      const blob = `${site.name} ${site.code} ${site.city} ${site.streamName}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
    return true;
  });
}

export function getSiteById(id: string) {
  return getDataset().sites.find((s) => s.id === id || s.code === id) ?? null;
}

export function getCountries() {
  return [...new Set(getDataset().sites.map((s) => s.country))].sort();
}

export function getCities(country?: string) {
  const sites = country ? getDataset().sites.filter((s) => s.country === country) : getDataset().sites;
  return [...new Set(sites.map((s) => s.city))].sort();
}

export function getIndicators(siteId?: string) {
  const rows = getDataset().indicators;
  return siteId ? rows.filter((r) => r.siteId === siteId) : rows;
}

export function getObservations(filters: Partial<AppFilters> & { type?: string } = {}) {
  return getDataset().observations.filter((o) => {
    if (filters.city && o.city !== filters.city) return false;
    if (filters.siteId && o.siteId !== filters.siteId) return false;
    if (filters.streamId) {
      if (filters.streamId && o.siteId) {
        const s = getSiteById(o.siteId);
        if (s && s.streamId !== filters.streamId) return false;
      }
    }
    if (filters.from && o.observedAt.slice(0, 10) < filters.from) return false;
    if (filters.to && o.observedAt.slice(0, 10) > filters.to) return false;
    if (filters.q) {
      const q = filters.q.toLowerCase();
      const blob = `${o.siteName} ${o.city} ${o.pollution} ${o.waterAppearance} ${o.biodiversity}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
    return true;
  });
}

function rowsForSite(siteId: string, from: string, to: string) {
  return getDataset().indicators.filter((r) => r.siteId === siteId && inRange(r.date, from, to));
}

function indicatorSeries(rows: IndicatorSnapshot[], key: keyof IndicatorSnapshot) {
  return rows.map((r) => {
    const v = r[key];
    return typeof v === "number" ? v : null;
  });
}

function compositeSeries(rows: IndicatorSnapshot[]) {
  return rows.map((r) => calculateCompositeScore(snapshotComponents(r)).score);
}

export function getSiteAnalytics(siteId: string, filters: AppFilters): SiteAnalytics | null {
  const site = getSiteById(siteId);
  if (!site) return null;
  const { from, to, prevFrom, prevTo, days } = resolveWindow(filters);
  const currentRows = rowsForSite(site.id, from, to);
  const previousRows = rowsForSite(site.id, prevFrom, prevTo);
  const latest = [...currentRows].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
  const components = latest ? snapshotComponents(latest) : null;
  const composite = components
    ? calculateCompositeScore(components)
    : calculateCompositeScore({
        waterQuality: null,
        biodiversity: null,
        habitat: null,
        citizenSignal: null,
        environmentalContext: null,
      });

  const completeness = calculateDataCompleteness(currentRows);
  const obs = getObservations({ siteId: site.id, from, to });
  const lastObs = obs.sort((a, b) => b.observedAt.localeCompare(a.observedAt))[0]?.observedAt ?? latest?.date ?? null;
  const daysSince = lastObs
    ? Math.round((new Date(`${DEMO_AS_OF}T00:00:00Z`).getTime() - new Date(lastObs).getTime()) / 86400000)
    : null;
  const indicatorCount = components
    ? Object.values(components).filter((v) => v !== null).length
    : 0;

  const values = currentRows.map((r) => calculateCompositeScore(snapshotComponents(r)).score).filter((v): v is number => v !== null);
  const variance = values.length > 2 ? stdev(values) : 10;
  const consistency = Math.max(0, 100 - variance * 4);

  const confidence = calculateConfidence({
    observationCount: currentRows.reduce((s, r) => s + r.observationCount, 0) + obs.length,
    indicatorCount,
    completeness: completeness.overall,
    daysSinceLastObservation: daysSince,
    historicalDays: days,
    sourceQuality: 72,
    consistency,
  });

  const trends = {
    waterQuality: calculateTrend(indicatorSeries(currentRows, "waterQuality"), indicatorSeries(previousRows, "waterQuality")),
    biodiversity: calculateTrend(indicatorSeries(currentRows, "biodiversity"), indicatorSeries(previousRows, "biodiversity")),
    habitat: calculateTrend(indicatorSeries(currentRows, "habitat"), indicatorSeries(previousRows, "habitat")),
    citizenSignal: calculateTrend(
      currentRows.map((r) => deriveCitizenSignal(r)),
      previousRows.map((r) => deriveCitizenSignal(r)),
    ),
    environmentalContext: calculateTrend(
      currentRows.map((r) => deriveEnvironmentalContext(r)),
      previousRows.map((r) => deriveEnvironmentalContext(r)),
    ),
    composite: calculateTrend(compositeSeries(currentRows), compositeSeries(previousRows)),
    pollution: calculateTrend(indicatorSeries(currentRows, "pollution"), indicatorSeries(previousRows, "pollution")),
  } as SiteAnalytics["trends"];

  const spatial = getSpatialContext(site, filters, composite.score);
  const decliningIndicators = (["waterQuality", "biodiversity", "habitat", "citizenSignal"] as const).filter(
    (k) => trends[k].direction === "declining",
  ).length;

  const hotspot = detectHotspot({
    score: composite.score,
    nearbyAverage: spatial.nearbyAverage,
    decliningIndicators,
    pollutionChange: trends.pollution.percentChange,
    trend: trends.composite.direction,
    observationCount: currentRows.length,
    confidenceLow: confidence.level === "low",
  });

  const structured = generateStructuredInsight({
    site: site.name,
    siteId: site.id,
    period: `${days} days`,
    water_change: trends.waterQuality.percentChange,
    habitat_change: trends.habitat.percentChange,
    biodiversity_change: trends.biodiversity.percentChange,
    pollution_change: trends.pollution.percentChange,
    composite_change: trends.composite.percentChange,
    confidence: confidence.level,
    status: composite.status,
    missing: composite.missing,
  });

  return {
    site,
    currentRows,
    previousRows,
    latest,
    components,
    composite,
    confidence,
    completeness,
    trends,
    observationCount: currentRows.reduce((s, r) => s + r.observationCount, 0) + obs.length,
    lastObservation: lastObs,
    spatial,
    hotspot,
    structured,
  };
}

export function getSpatialContext(site: Site, filters: AppFilters, score: number | null): SpatialContext {
  const nearby = getDataset().sites.filter((s) => s.id !== site.id && haversine(site.latitude, site.longitude, s.latitude, s.longitude) <= 8);
  const citySites = getDataset().sites.filter((s) => s.city === site.city && s.id !== site.id);
  const streamSites = getDataset().sites.filter((s) => s.streamId === site.streamId && s.id !== site.id);

  const nearbyAverage = mean(nearby.map((s) => siteScore(s.id, filters)));
  const cityAverage = mean(citySites.map((s) => siteScore(s.id, filters)));
  const streamAverage = mean(streamSites.map((s) => siteScore(s.id, filters)));

  return {
    nearbyAverage: nearbyAverage !== null ? round(nearbyAverage, 1) : null,
    cityAverage: cityAverage !== null ? round(cityAverage, 1) : null,
    streamAverage: streamAverage !== null ? round(streamAverage, 1) : null,
    vsNearby: score !== null && nearbyAverage !== null ? round(score - nearbyAverage, 1) : null,
    vsCity: score !== null && cityAverage !== null ? round(score - cityAverage, 1) : null,
    vsStream: score !== null && streamAverage !== null ? round(score - streamAverage, 1) : null,
  };
}

function siteScore(siteId: string, filters: AppFilters) {
  const { from, to } = resolveWindow(filters);
  const rows = rowsForSite(siteId, from, to);
  const latest = [...rows].sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!latest) return null;
  return calculateCompositeScore(snapshotComponents(latest)).score;
}

export function getDashboardSummary(filters: AppFilters) {
  const sites = getSites(filters);
  const analytics = sites
    .map((s) => getSiteAnalytics(s.id, filters))
    .filter((a): a is SiteAnalytics => Boolean(a));

  const filtered = analytics.filter((a) => !filters.status || a.composite.status === filters.status);
  const { from, to } = resolveWindow(filters);
  const observations = getObservations({ ...filters, from, to });

  const healthy = filtered.filter((a) => a.composite.status === "healthy").length;
  const watch = filtered.filter((a) => a.composite.status === "watch").length;
  const attention = filtered.filter((a) => a.composite.status === "attention").length;
  const coverage = filtered.length
    ? round(filtered.reduce((s, a) => s + a.completeness.overall, 0) / filtered.length, 0)
    : 0;

  const statusCounts = {
    healthy,
    watch,
    attention,
    insufficient: filtered.filter((a) => a.composite.status === "insufficient").length,
  };

  const healthTrend = trendSeries(filtered, filters, "composite");
  const indicatorTrend = trendSeries(filtered, filters, (filters.indicator as IndicatorKey) || "waterQuality");

  const changing = [...filtered]
    .filter((a) => a.trends.composite.percentChange !== null)
    .sort((a, b) => Math.abs(b.trends.composite.percentChange ?? 0) - Math.abs(a.trends.composite.percentChange ?? 0))
    .slice(0, 6);

  const hotspots = filtered.filter((a) => a.hotspot.isHotspot);

  return {
    sites: filtered,
    counts: {
      monitoringSites: filtered.length,
      observations: observations.length,
      healthy,
      watch,
      attention,
      coverage,
    },
    statusCounts,
    healthTrend,
    indicatorTrend,
    changing,
    hotspots,
    latestObservations: [...observations].sort((a, b) => b.observedAt.localeCompare(a.observedAt)).slice(0, 8),
    insights: generateInsightCards(filtered).slice(0, 6),
    completenessAvg: coverage,
  };
}

function trendSeries(sites: SiteAnalytics[], filters: AppFilters, key: IndicatorKey | "composite") {
  const { from, to } = resolveWindow(filters);
  const all = getDataset().indicators.filter((r) => inRange(r.date, from, to) && sites.some((s) => s.site.id === r.siteId));
  const byDate = new Map<string, number[]>();
  for (const row of all) {
    const components = snapshotComponents(row);
    const value =
      key === "composite" ? calculateCompositeScore(components).score : components[key];
    if (value === null) continue;
    const arr = byDate.get(row.date) ?? [];
    arr.push(value);
    byDate.set(row.date, arr);
  }
  return [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, vals]) => ({ date, value: round(mean(vals) ?? 0, 1) }));
}

export function searchAll(q: string) {
  const query = q.trim().toLowerCase();
  if (!query) return { cities: [], streams: [], sites: [], observations: [] };
  const dataset = getDataset();
  const cities = [...new Set(dataset.sites.map((s) => s.city))].filter((c) => c.toLowerCase().includes(query)).slice(0, 5);
  const streams = dataset.streams.filter((s) => s.name.toLowerCase().includes(query) || s.city.toLowerCase().includes(query)).slice(0, 6);
  const sites = dataset.sites
    .filter((s) => `${s.name} ${s.code} ${s.streamName} ${s.city}`.toLowerCase().includes(query))
    .slice(0, 8);
  const observations = dataset.observations
    .filter((o) => `${o.siteName} ${o.pollution} ${o.biodiversity}`.toLowerCase().includes(query))
    .slice(0, 6);
  return { cities, streams, sites, observations };
}

export function getMapSites(filters: AppFilters) {
  return getSites(filters)
    .map((site) => getSiteAnalytics(site.id, filters))
    .filter((a): a is SiteAnalytics => Boolean(a))
    .filter((a) => !filters.status || a.composite.status === filters.status);
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function stdev(values: number[]) {
  const m = mean(values) ?? 0;
  const v = values.reduce((s, x) => s + (x - m) ** 2, 0) / values.length;
  return Math.sqrt(v);
}

export { INDICATOR_LABELS };
