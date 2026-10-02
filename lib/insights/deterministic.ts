import type {
  HealthStatus,
  InsightCard,
  InsightCategory,
  InsightSeverity,
  SiteAnalyticsView,
  StructuredInsight,
} from "@/types";
import { renderDeterministicSummary } from "@/lib/insights/templates";

export function generateStructuredInsight(input: StructuredInsight): StructuredInsight {
  return input;
}

export function generateDeterministicInsight(input: StructuredInsight) {
  return renderDeterministicSummary(input);
}

export function generateInsightCards(sites: SiteAnalyticsView[]): InsightCard[] {
  const cards: InsightCard[] = [];

  for (const a of sites) {
    const ts = a.lastObservation ?? a.latest?.date ?? "";
    if (a.hotspot.isHotspot) {
      cards.push(card(a, "hotspot", "attention", "Composite", a.trends.composite.percentChange, ts,
        `${a.site.name} is a potential monitoring hotspot. ${a.hotspot.reasons[0] ?? ""}`.trim()));
    }
    if (a.composite.missing.length > 0) {
      cards.push(card(a, "data_gap", "info", "Data coverage", null, ts,
        `${a.site.name} is missing ${a.composite.missing.join(", ")} for this period. Coverage gaps reduce confidence and are not treated as poor ecosystem health.`));
    }
    if (a.trends.waterQuality.percentChange !== null && a.trends.waterQuality.percentChange <= -8) {
      cards.push(card(a, "declining", severity(a.composite.status), "Water quality", a.trends.waterQuality.percentChange, ts,
        `Water-quality indicator decreased ${Math.abs(a.trends.waterQuality.percentChange)}% compared with the previous period.`));
    } else if (a.trends.waterQuality.percentChange !== null && a.trends.waterQuality.percentChange >= 8) {
      cards.push(card(a, "improving", "info", "Water quality", a.trends.waterQuality.percentChange, ts,
        `Water-quality indicator increased ${a.trends.waterQuality.percentChange}% compared with the previous period.`));
    }
    if (a.trends.composite.direction === "stable") {
      cards.push(card(a, "stable", "info", "Composite", a.trends.composite.percentChange, ts,
        `Composite indicator at ${a.site.name} remained relatively stable over the selected window.`));
    }
    if (a.trends.pollution.percentChange !== null && Math.abs(a.trends.pollution.percentChange) >= 15) {
      cards.push(card(a, "unusual_change", "watch", "Pollution observations", a.trends.pollution.percentChange, ts,
        `Pollution-related observations changed ${a.trends.pollution.percentChange}% versus the previous equivalent period.`));
    }
  }

  const newest = [...sites].sort((a, b) => (b.lastObservation ?? "").localeCompare(a.lastObservation ?? "")).slice(0, 4);
  for (const a of newest) {
    cards.push(card(a, "new_observation", "info", "Citizen observations", null, a.lastObservation ?? "",
      `Latest observation activity recorded at ${a.site.name}.`));
  }

  return cards.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

function severity(status: HealthStatus): InsightSeverity {
  if (status === "attention") return "attention";
  if (status === "watch") return "watch";
  return "info";
}

function card(
  a: SiteAnalyticsView,
  category: InsightCategory,
  severity: InsightSeverity,
  indicator: string,
  change: number | null,
  timestamp: string,
  explanation: string,
): InsightCard {
  return {
    id: `${a.site.id}-${category}-${indicator}`,
    siteId: a.site.id,
    siteName: a.site.name,
    city: a.site.city,
    timestamp,
    category,
    severity,
    indicator,
    change,
    confidence: a.confidence.level,
    explanation,
  };
}

export function whyFlagged(a: SiteAnalyticsView) {
  if (a.composite.status === "healthy" || a.composite.status === "insufficient") return [];
  const items: { label: string; change: number | null }[] = [];
  const push = (label: string, change: number | null, worseIfPositive = false) => {
    if (change === null) return;
    const bad = worseIfPositive ? change >= 5 : change <= -3;
    if (bad) items.push({ label, change });
  };
  push("Water quality", a.trends.waterQuality.percentChange);
  push("Habitat condition", a.trends.habitat.percentChange);
  push("Biodiversity", a.trends.biodiversity.percentChange);
  push("Pollution-related observations", a.trends.pollution.percentChange, true);
  push("Citizen observation signal", a.trends.citizenSignal.percentChange);
  if (a.composite.score !== null && a.composite.score < 80) {
    items.push({ label: `Composite indicator at ${a.composite.score}/100`, change: a.trends.composite.percentChange });
  }
  return items.sort((x, y) => Math.abs(y.change ?? 0) - Math.abs(x.change ?? 0));
}

export function keyChange(a: SiteAnalyticsView) {
  const candidates = [
    { label: "water-quality indicator", change: a.trends.waterQuality.percentChange, invert: false },
    { label: "habitat condition", change: a.trends.habitat.percentChange, invert: false },
    { label: "biodiversity indicator", change: a.trends.biodiversity.percentChange, invert: false },
    { label: "pollution-related observations", change: a.trends.pollution.percentChange, invert: true },
  ].filter((c) => c.change !== null) as Array<{ label: string; change: number; invert: boolean }>;
  if (!candidates.length) return "Not enough comparable data to describe a key change.";
  const top = [...candidates].sort((x, y) => Math.abs(y.change) - Math.abs(x.change))[0];
  const direction = top.change > 0 ? "an increase" : "a decrease";
  return `The largest observed change is ${direction} in ${top.label} (${top.change > 0 ? "+" : ""}${top.change}%).`;
}

export function oneHealthContext(a: SiteAnalyticsView) {
  const lines = [
    "One Health recognizes relationships among environmental quality, ecosystem condition, animal communities and potential relevance to community well-being.",
  ];
  if (a.composite.status === "attention" || a.hotspot.isHotspot) {
    lines.push(
      "These environmental conditions may be relevant to ecosystem and community well-being. This is not a medical diagnosis and does not confirm human health risk.",
    );
  } else if (a.composite.status === "watch") {
    lines.push(
      "Observed patterns warrant continued monitoring. Environmental evidence should be interpreted alongside appropriate scientific and public-health information.",
    );
  } else {
    lines.push(
      "Current indicators do not show an attention-level environmental signal in this prototype window. Continued monitoring still helps detect change early.",
    );
  }
  lines.push("AquaInsight does not claim causation from these indicators alone.");
  return lines;
}
