import { FilterBar } from "@/components/filters/filter-bar";
import { DistributionBars, TrendChart } from "@/components/charts/charts";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/states";
import { getCities, getCountries, getDashboardSummary, getStreams } from "@/lib/data/queries";
import { parseFilters } from "@/lib/filters";
import { formatDate, formatNumber, formatPercent } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/states";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const sp = await searchParams;
  const filters = parseFilters(sp as Record<string, string | string[] | undefined>);
  const summary = getDashboardSummary(filters);
  const countries = getCountries();
  const cities = getCities(filters.country);
  const streams = getStreams();

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Demo dataset</p>
        <h1 className="text-3xl font-semibold tracking-tight">Stream Health Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">All figures are calculated from the synthetic demo series for the selected filters.</p>
      </div>
      <Suspense fallback={<Skeleton className="h-28" />}>
        <FilterBar countries={countries} cities={cities} streams={streams} />
      </Suspense>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {[
          ["Monitoring sites", summary.counts.monitoringSites],
          ["Total observations", summary.counts.observations],
          ["Healthy / stable", summary.counts.healthy],
          ["Watch sites", summary.counts.watch],
          ["Attention sites", summary.counts.attention],
          ["Data coverage", `${summary.counts.coverage}%`],
        ].map(([label, value]) => (
          <Card key={String(label)} className="p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>
      {!summary.sites.length ? (
        <EmptyState title="No sites in this view" body="No observations available for this site and date range. Adjust filters." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardTitle>Stream health distribution</CardTitle>
            <CardDesc>Prototype visualization categories, not official ecological classes.</CardDesc>
            <DistributionBars
              data={[
                { name: "Healthy", value: summary.statusCounts.healthy, color: "#2f7d4a" },
                { name: "Watch", value: summary.statusCounts.watch, color: "#b5811a" },
                { name: "Attention", value: summary.statusCounts.attention, color: "#b4453a" },
                { name: "Unknown", value: summary.statusCounts.insufficient, color: "#6b7280" },
              ]}
            />
          </Card>
          <Card>
            <CardTitle>Health trend</CardTitle>
            <CardDesc>Mean composite indicator across filtered sites.</CardDesc>
            <TrendChart data={summary.healthTrend} />
          </Card>
          <Card>
            <CardTitle>Indicator trend</CardTitle>
            <CardDesc>Selected indicator over the same window.</CardDesc>
            <TrendChart data={summary.indicatorTrend} color="#3f6f52" />
          </Card>
          <Card>
            <CardTitle>Data quality</CardTitle>
            <CardDesc>Average completeness is coverage, not ecosystem health.</CardDesc>
            <p className="mt-6 text-4xl font-semibold">{summary.completenessAvg}%</p>
            <p className="mt-2 text-sm text-muted-foreground">Mean field coverage across filtered monitoring sites.</p>
          </Card>
          <Card>
            <CardTitle>Recent insights</CardTitle>
            <ul className="mt-3 space-y-3">
              {summary.insights.slice(0, 5).map((i) => (
                <li key={i.id} className="text-sm">
                  <Link href={`/sites/${i.siteId}`} className="font-medium hover:underline">{i.siteName}</Link>
                  <p className="text-muted-foreground">{i.explanation}</p>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardTitle>Top changing sites</CardTitle>
            <ul className="mt-3 space-y-3">
              {summary.changing.map((s) => (
                <li key={s.site.id} className="flex items-center justify-between gap-3 text-sm">
                  <Link href={`/sites/${s.site.id}`} className="hover:underline">{s.site.name}</Link>
                  <span>{formatPercent(s.trends.composite.percentChange)}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardTitle>Potential monitoring hotspots</CardTitle>
            <CardDesc>Explainable flags — not confirmed pollution hotspots.</CardDesc>
            {summary.hotspots.length ? (
              <ul className="mt-3 space-y-2">
                {summary.hotspots.slice(0, 6).map((s) => (
                  <li key={s.site.id}>
                    <Link href={`/sites/${s.site.id}`} className="text-sm hover:underline">{s.site.name}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No hotspot criteria met in this window.</p>
            )}
          </Card>
          <Card>
            <CardTitle>Latest observations</CardTitle>
            <ul className="mt-3 space-y-2 text-sm">
              {summary.latestObservations.map((o) => (
                <li key={o.id}>
                  {formatDate(o.observedAt)} · {o.siteName} · {o.pollution ?? "—"}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
      <Card>
        <CardTitle>Geographic distribution</CardTitle>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-muted-foreground">
                <th className="py-2 pr-4">Site</th>
                <th className="py-2 pr-4">City</th>
                <th className="py-2 pr-4">Score</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {summary.sites.slice(0, 12).map((s) => (
                <tr key={s.site.id} className="border-t border-border">
                  <td className="py-2 pr-4"><Link href={`/sites/${s.site.id}`}>{s.site.name}</Link></td>
                  <td className="py-2 pr-4">{s.site.city}</td>
                  <td className="py-2 pr-4">{formatNumber(s.composite.score, 1)}</td>
                  <td className="py-2 pr-4"><StatusBadge status={s.composite.status} /></td>
                  <td className="py-2 pr-4 capitalize">{s.confidence.level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
