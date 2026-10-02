import Link from "next/link";
import { FilterBar } from "@/components/filters/filter-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { getCities, getCountries, getDashboardSummary, getStreams } from "@/lib/data/queries";
import { parseFilters } from "@/lib/filters";
import { formatNumber, formatPercent } from "@/lib/utils";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/states";

export const metadata = { title: "Sites" };

export default async function SitesPage({ searchParams }: PageProps<"/sites">) {
  const sp = await searchParams;
  const filters = parseFilters(sp as Record<string, string | string[] | undefined>);
  const summary = getDashboardSummary(filters);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-semibold">Monitoring sites</h1>
        <p className="text-sm text-muted-foreground">Search and filter operate on the demo dataset. Click a site for calculated indicators.</p>
      </div>
      <Suspense fallback={<Skeleton className="h-28" />}>
        <FilterBar countries={getCountries()} cities={getCities(filters.country)} streams={getStreams()} />
      </Suspense>
      {!summary.sites.length ? (
        <EmptyState title="No matching sites" body="Try another city, stream or search term." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {summary.sites.map((s) => (
            <Link key={s.site.id} href={`/sites/${s.site.id}`}>
              <Card className="h-full hover:border-primary/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{s.site.name}</p>
                    <p className="text-xs text-muted-foreground">{s.site.code} · {s.site.city}, {s.site.country}</p>
                  </div>
                  <StatusBadge status={s.composite.status} />
                </div>
                <p className="mt-3 text-sm">Composite {formatNumber(s.composite.score, 1)} / 100 · {s.confidence.level} confidence · change {formatPercent(s.trends.composite.percentChange)}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
