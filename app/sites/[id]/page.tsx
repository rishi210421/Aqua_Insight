import Link from "next/link";
import { notFound } from "next/navigation";
import { TrendChart } from "@/components/charts/charts";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { FilterBar } from "@/components/filters/filter-bar";
import { getCities, getCountries, getSiteAnalytics, getSiteById, getStreams } from "@/lib/data/queries";
import { parseFilters } from "@/lib/filters";
import { keyChange, oneHealthContext, whyFlagged } from "@/lib/insights/deterministic";
import { generateDeterministicInsight } from "@/lib/insights/deterministic";
import { INDICATOR_HELP, INDICATOR_LABELS } from "@/lib/config";
import { formatDate, formatNumber, formatPercent } from "@/lib/utils";
import type { IndicatorKey } from "@/types";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/states";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const site = getSiteById(id);
  return { title: site?.name ?? "Site" };
}

export default async function SitePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const analytics = getSiteAnalytics(id, filters);
  if (!analytics) notFound();
  const { site, composite, confidence, completeness, trends, components } = analytics;
  const flagged = whyFlagged(analytics);
  const keys: IndicatorKey[] = ["waterQuality", "biodiversity", "habitat", "citizenSignal", "environmentalContext"];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-watch">Demo / synthetic dataset</p>
      <header>
        <p className="text-sm text-muted-foreground">{site.streamName} · {site.city}, {site.country}</p>
        <h1 className="text-3xl font-semibold">{site.name}</h1>
        <p className="text-sm text-muted-foreground">Monitoring site ID {site.code}</p>
      </header>
      <Suspense fallback={<Skeleton className="h-28" />}>
        <FilterBar countries={getCountries()} cities={getCities(filters.country)} streams={getStreams()} />
      </Suspense>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>AquaInsight Composite Stream Health Indicator</CardTitle>
            <CardDesc>Prototype methodology — not an official OneAquaHealth score.</CardDesc>
            <p className="mt-4 text-5xl font-semibold">{formatNumber(composite.score, 1)} <span className="text-lg text-muted-foreground">/ 100</span></p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={composite.status} />
              <Badge className="capitalize">Confidence: {confidence.level}</Badge>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Data completeness</dt>
            <dd>{completeness.overall}%</dd>
            <dt className="text-muted-foreground">Observation count</dt>
            <dd>{analytics.observationCount}</dd>
            <dt className="text-muted-foreground">Last updated</dt>
            <dd>{analytics.lastObservation ? formatDate(analytics.lastObservation) : "—"}</dd>
          </dl>
        </div>
        {composite.redistributionNote && (
          <p className="mt-4 rounded-xl bg-muted p-3 text-sm">{composite.redistributionNote}</p>
        )}
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-medium">How is this calculated?</summary>
          <p className="mt-2 text-muted-foreground">Default weights: water quality 30%, biodiversity 25%, habitat 20%, citizen observation signal 15%, environmental context 10%. Missing components are omitted and remaining weights are renormalized. Treating missing data as zero is avoided.</p>
        </details>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>What changed?</CardTitle>
          <CardDesc>Current period versus the previous equivalent window.</CardDesc>
          <ul className="mt-4 space-y-2 text-sm">
            <li>Water quality {formatPercent(trends.waterQuality.percentChange)} · {trends.waterQuality.direction}</li>
            <li>Habitat {formatPercent(trends.habitat.percentChange)} · {trends.habitat.direction}</li>
            <li>Biodiversity {formatPercent(trends.biodiversity.percentChange)} · {trends.biodiversity.direction}</li>
            <li>Pollution observations {formatPercent(trends.pollution.percentChange)} · {trends.pollution.direction}</li>
          </ul>
          <p className="mt-4 text-sm"><span className="font-medium">Key change. </span>{keyChange(analytics)}</p>
        </Card>
        <Card>
          <CardTitle>Why is this site flagged?</CardTitle>
          {composite.status === "watch" || composite.status === "attention" ? (
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
              {flagged.map((f) => (
                <li key={f.label}>{f.label}{f.change !== null ? ` (${formatPercent(f.change)})` : ""}</li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">This site is not in Watch or Attention for the selected window. Prototype categories are visualization aids, not official ecological classifications.</p>
          )}
          <p className="mt-3 text-sm">Confidence: {confidence.level}</p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {keys.map((key) => {
          const trend = trends[key];
          const value = components?.[key] ?? null;
          return (
            <Card key={key}>
              <CardTitle>{INDICATOR_LABELS[key]}</CardTitle>
              <CardDesc>{INDICATOR_HELP[key]}</CardDesc>
              <p className="mt-2 text-2xl font-semibold">{value === null ? "Missing" : formatNumber(value, 1)}</p>
              <p className="text-sm text-muted-foreground">Trend {trend.direction} · {formatPercent(trend.percentChange)}{trend.note ? ` · ${trend.note}` : ""}</p>
              <TrendChart data={analytics.currentRows.map((r) => ({
                date: r.date,
                value: Number(
                  key === "waterQuality" ? r.waterQuality
                    : key === "biodiversity" ? r.biodiversity
                      : key === "habitat" ? r.habitat
                        : key === "citizenSignal" ? (100 - (r.pollution ?? 50) + (r.vegetation ?? 50)) / 2
                          : r.rainfall ?? 0,
                ),
              })).filter((d) => Number.isFinite(d.value))} />
            </Card>
          );
        })}
      </div>

      <Card>
        <CardTitle>Spatial context</CardTitle>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
          <p>Nearby-site average: {formatNumber(analytics.spatial.nearbyAverage, 1)} (Δ {formatNumber(analytics.spatial.vsNearby, 1)})</p>
          <p>City average: {formatNumber(analytics.spatial.cityAverage, 1)} (Δ {formatNumber(analytics.spatial.vsCity, 1)})</p>
          <p>Stream average: {formatNumber(analytics.spatial.streamAverage, 1)} (Δ {formatNumber(analytics.spatial.vsStream, 1)})</p>
        </div>
        {analytics.spatial.vsNearby !== null && analytics.spatial.vsNearby < 0 && (
          <p className="mt-3 text-sm text-muted-foreground">This site currently has a lower composite indicator than nearby monitored sites. This does not establish causation.</p>
        )}
        {analytics.hotspot.isHotspot && (
          <div className="mt-4 rounded-xl border border-watch/40 bg-watch/10 p-3 text-sm">
            <p className="font-medium">Potential monitoring hotspot</p>
            <ul className="mt-2 list-disc pl-5">
              {analytics.hotspot.reasons.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Data confidence</CardTitle>
        <p className="mt-1 text-sm capitalize">Level: {confidence.level}</p>
        <ul className="mt-3 space-y-1 text-sm">
          {confidence.factors.map((f) => (
            <li key={f.label}>{f.ok ? "✓" : "✗"} {f.label}</li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardTitle>Data coverage</CardTitle>
        <CardDesc>Missing fields reduce confidence; they are not scored as poor ecosystem health.</CardDesc>
        <ul className="mt-3 space-y-1 text-sm">
          {Object.entries(completeness.byIndicator).map(([k, v]) => (
            <li key={k} className="flex justify-between"><span>{k}</span><span>{v}%</span></li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardTitle>One Health context</CardTitle>
        {oneHealthContext(analytics).map((line) => (
          <p key={line} className="mt-2 text-sm leading-6 text-muted-foreground">{line}</p>
        ))}
      </Card>

      <Card>
        <CardTitle>Insight summary</CardTitle>
        <p className="mt-2 text-sm leading-7">{generateDeterministicInsight(analytics.structured)}</p>
        <p className="mt-3 text-xs text-muted-foreground">Generated from structured analytics. Optional LLM summarization is unused unless an API key is configured.</p>
      </Card>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link className="rounded-full bg-primary px-4 py-2 text-primary-foreground" href={`/compare?sites=${site.id}`}>Compare nearby</Link>
        <Link className="rounded-full border border-border px-4 py-2" href={`/reports?site=${site.id}`}>Generate report</Link>
      </div>
    </div>
  );
}
