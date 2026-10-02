import { getDashboardSummary, getSiteById, getSiteAnalytics, getSites } from "@/lib/data/queries";
import type { AppFilters } from "@/types";
import { DEMO_AS_OF } from "@/lib/config";

export interface AskResult {
  interpretation: string;
  kind: string;
  rows: Array<Record<string, string | number | null>>;
}

const PATTERNS: Array<{
  test: (q: string) => boolean;
  run: (q: string, filters: AppFilters) => AskResult;
}> = [
  {
    test: (q) => /declin/.test(q) && /site/.test(q),
    run: (_q, filters) => {
      const summary = getDashboardSummary(filters);
      const rows = [...summary.sites]
        .filter((s) => s.trends.composite.percentChange !== null)
        .sort((a, b) => (a.trends.composite.percentChange ?? 0) - (b.trends.composite.percentChange ?? 0))
        .slice(0, 8)
        .map((s) => ({
          site: s.site.name,
          city: s.site.city,
          change: s.trends.composite.percentChange,
          score: s.composite.score,
          confidence: s.confidence.level,
        }));
      return {
        interpretation: "Sites with the largest composite-indicator decline in the selected period.",
        kind: "declining_sites",
        rows,
      };
    },
  },
  {
    test: (q) => /biodivers/.test(q) && /(high|highest|top)/.test(q),
    run: (_q, filters) => {
      const summary = getDashboardSummary(filters);
      const rows = [...summary.sites]
        .filter((s) => s.components?.biodiversity != null)
        .sort((a, b) => (b.components?.biodiversity ?? 0) - (a.components?.biodiversity ?? 0))
        .slice(0, 8)
        .map((s) => ({
          site: s.site.name,
          stream: s.site.streamName,
          biodiversity: s.components?.biodiversity ?? null,
          confidence: s.confidence.level,
        }));
      return { interpretation: "Streams/sites with the highest biodiversity indicator in the current window.", kind: "biodiversity", rows };
    },
  },
  {
    test: (q) => /low confidence|confidence/.test(q),
    run: (_q, filters) => {
      const summary = getDashboardSummary(filters);
      const rows = summary.sites
        .filter((s) => s.confidence.level === "low")
        .slice(0, 12)
        .map((s) => ({
          site: s.site.name,
          city: s.site.city,
          confidence: s.confidence.level,
          coverage: s.completeness.overall,
        }));
      return { interpretation: "Sites currently assessed with low data confidence.", kind: "low_confidence", rows };
    },
  },
  {
    test: (q) => /pollution/.test(q),
    run: (_q, filters) => {
      const summary = getDashboardSummary(filters);
      const rows = [...summary.sites]
        .filter((s) => (s.trends.pollution.percentChange ?? 0) > 0)
        .sort((a, b) => (b.trends.pollution.percentChange ?? 0) - (a.trends.pollution.percentChange ?? 0))
        .slice(0, 8)
        .map((s) => ({
          site: s.site.name,
          city: s.site.city,
          pollutionChange: s.trends.pollution.percentChange,
          score: s.composite.score,
        }));
      return { interpretation: "Locations with increasing pollution-related observations.", kind: "pollution", rows };
    },
  },
  {
    test: (q) => /water quality/.test(q) && /declin/.test(q),
    run: (_q, filters) => {
      const summary = getDashboardSummary(filters);
      const rows = [...summary.sites]
        .filter((s) => s.trends.waterQuality.direction === "declining")
        .sort((a, b) => (a.trends.waterQuality.percentChange ?? 0) - (b.trends.waterQuality.percentChange ?? 0))
        .slice(0, 8)
        .map((s) => ({
          site: s.site.name,
          waterChange: s.trends.waterQuality.percentChange,
          score: s.composite.score,
          confidence: s.confidence.level,
        }));
      return { interpretation: "Sites with declining water-quality indicators.", kind: "wq_decline", rows };
    },
  },
  {
    test: (q) => /compare/.test(q),
    run: (q, filters) => {
      const ids = getSites(filters)
        .filter((s) => q.toLowerCase().includes(s.name.toLowerCase().slice(0, 12)) || q.toLowerCase().includes(s.code.toLowerCase()))
        .slice(0, 5);
      const picked = ids.length >= 2 ? ids : getSites(filters).slice(0, 2);
      const rows = picked.map((site) => {
        const a = getSiteAnalytics(site.id, filters);
        return {
          site: site.name,
          score: a?.composite.score ?? null,
          water: a?.components?.waterQuality ?? null,
          biodiversity: a?.components?.biodiversity ?? null,
          habitat: a?.components?.habitat ?? null,
        };
      });
      return { interpretation: "Structured comparison of selected sites (validated query, no arbitrary SQL).", kind: "compare", rows };
    },
  },
];

export function askAquaInsight(question: string, filters: AppFilters): AskResult {
  const q = question.toLowerCase();
  for (const p of PATTERNS) {
    if (p.test(q)) return p.run(q, filters);
  }
  const summary = getDashboardSummary({ ...filters, range: filters.range || "30d" });
  const attention = summary.sites.filter((s) => s.composite.status === "attention").slice(0, 8);
  return {
    interpretation:
      "No exact predefined pattern matched. Showing attention-status sites for the current filters. Try: “Which sites declined the most this month?”",
    kind: "fallback",
    rows: attention.map((s) => ({
      site: s.site.name,
      city: s.site.city,
      score: s.composite.score,
      status: s.composite.status,
      asOf: DEMO_AS_OF,
    })),
  };
}

export function parseCompareIds(question: string) {
  const mention = getSiteById;
  return mention;
}
