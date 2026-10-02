import Link from "next/link";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { getDashboardSummary, getSites } from "@/lib/data/queries";
import { parseFilters } from "@/lib/filters";
import { formatDate, formatPercent } from "@/lib/utils";

export const metadata = { title: "Insights" };

export default async function InsightsPage({ searchParams }: PageProps<"/insights">) {
  const sp = await searchParams;
  const filters = parseFilters(sp as Record<string, string | string[] | undefined>);
  const summary = getDashboardSummary(filters);
  const sites = getSites();
  const siteFilter = typeof sp.site === "string" ? sp.site : "";
  const categoryFilter = typeof sp.category === "string" ? sp.category : "all";
  const confidenceFilter = typeof sp.confidence === "string" ? sp.confidence : "all";

  let insights = summary.insights;
  if (siteFilter) insights = insights.filter((item) => item.siteId === siteFilter);
  if (categoryFilter !== "all") insights = insights.filter((item) => item.category === categoryFilter);
  if (confidenceFilter !== "all") insights = insights.filter((item) => item.confidence === confidenceFilter);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Track 2 analytics</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Stream Health Insights</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Discover changes, emerging patterns, monitoring priorities, and data gaps across monitored streams.
        </p>
      </div>

      <Card>
        <CardTitle>Insight filters</CardTitle>
        <CardDesc>All insights are derived from the current filtered dataset and are traceable to the selected window.</CardDesc>
        <form method="get" className="mt-4 grid gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Site</label>
            <select name="site" defaultValue={siteFilter} className="w-full rounded-xl border border-border bg-background px-3 py-2">
              <option value="">All sites</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Category</label>
            <select name="category" defaultValue={categoryFilter} className="w-full rounded-xl border border-border bg-background px-3 py-2">
              <option value="all">All categories</option>
              <option value="improving">Improving</option>
              <option value="declining">Declining</option>
              <option value="stable">Stable</option>
              <option value="hotspot">Hotspot</option>
              <option value="data_gap">Data gap</option>
              <option value="new_observation">Recent observation</option>
              <option value="unusual_change">Unusual change</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Confidence</label>
            <select name="confidence" defaultValue={confidenceFilter} className="w-full rounded-xl border border-border bg-background px-3 py-2">
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="inline-flex h-10 w-full items-center justify-center rounded-full bg-primary px-4 text-sm text-primary-foreground">Apply</button>
          </div>
        </form>
      </Card>

      {!insights.length ? (
        <EmptyState title="No insights match the selected filters." body="Try a different site, date range or confidence threshold." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {insights.map((insight) => (
            <Card key={insight.id} className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{insight.category}</p>
                  <CardTitle className="mt-1">{insight.indicator}</CardTitle>
                </div>
                <span className="rounded-full border border-border px-2 py-1 text-xs capitalize">{insight.confidence}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>{insight.siteName} · {insight.city}</p>
                <p>{insight.timestamp ? formatDate(insight.timestamp) : "—"}</p>
              </div>
              <p className="text-sm leading-6">{insight.explanation}</p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {insight.change !== null ? <span>Change: {formatPercent(insight.change)}</span> : null}
                <span>Severity: {insight.severity}</span>
              </div>
              <div className="flex gap-2">
                <Link href={`/sites/${insight.siteId}`} className="rounded-full border border-border px-3 py-1.5 text-sm">Site details</Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
