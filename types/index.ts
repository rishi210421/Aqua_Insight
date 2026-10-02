export type HealthStatus = "healthy" | "watch" | "attention" | "insufficient";
export type ConfidenceLevel = "high" | "medium" | "low";
export type TrendDirection = "improving" | "declining" | "stable" | "insufficient";
export type ObservationValidation = "validated" | "needs_review" | "incomplete";
export type InsightCategory =
  | "improving"
  | "declining"
  | "stable"
  | "hotspot"
  | "data_gap"
  | "new_observation"
  | "unusual_change";
export type InsightSeverity = "info" | "watch" | "attention";
export type IndicatorKey =
  | "waterQuality"
  | "biodiversity"
  | "habitat"
  | "citizenSignal"
  | "environmentalContext";
export type DateRangeKey = "7d" | "30d" | "90d" | "1y" | "custom";

export interface DataSource {
  id: string;
  sourceName: string;
  sourceUrl: string;
  license: string;
  retrievedAt: string;
  description: string;
  isSynthetic: boolean;
  dataType: string;
}

export interface Stream {
  id: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
}

export interface Site {
  id: string;
  code: string;
  name: string;
  streamId: string;
  streamName: string;
  city: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  profile: SiteProfile;
}

export type SiteProfile =
  | "declining"
  | "improving"
  | "stable"
  | "gap"
  | "hotspot"
  | "mixed";

export interface IndicatorSnapshot {
  siteId: string;
  date: string;
  waterQuality: number | null;
  biodiversity: number | null;
  habitat: number | null;
  pollution: number | null;
  vegetation: number | null;
  flow: number | null;
  rainfall: number | null;
  temperature: number | null;
  observationCount: number;
}

export interface CitizenObservation {
  id: string;
  siteId: string;
  siteName: string;
  streamName: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  observedAt: string;
  waterAppearance: string | null;
  flow: string | null;
  vegetation: string | null;
  pollution: string | null;
  biodiversity: string | null;
  notes: string | null;
  photoUrl: string | null;
  source: string;
  dataQuality: ObservationValidation;
  flags: string[];
}

export interface IndicatorComponents {
  waterQuality: number | null;
  biodiversity: number | null;
  habitat: number | null;
  citizenSignal: number | null;
  environmentalContext: number | null;
}

export interface CompositeResult {
  score: number | null;
  status: HealthStatus;
  usedWeights: Partial<Record<IndicatorKey, number>>;
  missing: IndicatorKey[];
  redistributionNote: string | null;
}

export interface ConfidenceResult {
  level: ConfidenceLevel;
  score: number;
  factors: { label: string; ok: boolean }[];
}

export interface CompletenessResult {
  overall: number;
  byIndicator: Record<string, number>;
  missingFields: string[];
}

export interface TrendResult {
  current: number | null;
  previous: number | null;
  absoluteChange: number | null;
  percentChange: number | null;
  direction: TrendDirection;
  note: string | null;
}

export interface HotspotResult {
  isHotspot: boolean;
  reasons: string[];
}

export interface SpatialContext {
  nearbyAverage: number | null;
  cityAverage: number | null;
  streamAverage: number | null;
  vsNearby: number | null;
  vsCity: number | null;
  vsStream: number | null;
}

export interface StructuredInsight {
  site: string;
  siteId: string;
  period: string;
  water_change: number | null;
  habitat_change: number | null;
  biodiversity_change: number | null;
  pollution_change: number | null;
  composite_change: number | null;
  confidence: ConfidenceLevel;
  status: HealthStatus;
  missing: IndicatorKey[];
}

export interface InsightCard {
  id: string;
  siteId: string;
  siteName: string;
  city: string;
  timestamp: string;
  category: InsightCategory;
  severity: InsightSeverity;
  indicator: string;
  change: number | null;
  confidence: ConfidenceLevel;
  explanation: string;
}

export interface AppFilters {
  country?: string;
  city?: string;
  streamId?: string;
  siteId?: string;
  range: DateRangeKey;
  from?: string;
  to?: string;
  indicator?: IndicatorKey | "composite";
  status?: HealthStatus;
  q?: string;
}

export interface SystemConfig {
  weights: Record<IndicatorKey, number>;
  thresholds: { healthy: number; watch: number };
  demoAsOf: string;
  isDemo: boolean;
}

export interface SiteAnalyticsView {
  site: Site;
  currentRows: IndicatorSnapshot[];
  previousRows: IndicatorSnapshot[];
  latest: IndicatorSnapshot | null;
  components: IndicatorComponents | null;
  composite: CompositeResult;
  confidence: ConfidenceResult;
  completeness: CompletenessResult;
  trends: Record<IndicatorKey | "composite" | "pollution", TrendResult>;
  observationCount: number;
  lastObservation: string | null;
  spatial: SpatialContext;
  hotspot: HotspotResult;
  structured: StructuredInsight;
}
