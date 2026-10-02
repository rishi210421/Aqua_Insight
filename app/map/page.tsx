import { StreamMap } from "@/components/maps/stream-map";
import { FilterBar } from "@/components/filters/filter-bar";
import { getCities, getCountries, getMapSites, getStreams } from "@/lib/data/queries";
import { parseFilters } from "@/lib/filters";
import { EmptyState } from "@/components/ui/states";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/states";

export const metadata = { title: "Map" };

export default async function MapPage({ searchParams }: PageProps<"/map">) {
  const sp = await searchParams;
  const filters = parseFilters(sp as Record<string, string | string[] | undefined>);
  const sites = getMapSites(filters).map((a) => ({
    id: a.site.id,
    name: a.site.name,
    city: a.site.city,
    streamName: a.site.streamName,
    latitude: a.site.latitude,
    longitude: a.site.longitude,
    status: a.composite.status,
    score: a.composite.score,
    confidence: a.confidence.level,
    lastObservation: a.lastObservation,
    change: a.trends.composite.percentChange,
    hotspot: a.hotspot.isHotspot,
    biodiversity: a.components?.biodiversity ?? null,
    waterQuality: a.components?.waterQuality ?? null,
    habitat: a.components?.habitat ?? null,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Demo dataset</p>
        <h1 className="text-3xl font-semibold">Interactive map</h1>
        <p className="text-sm text-muted-foreground">Markers are calculated site statuses for the selected window. Public OSM-compatible tiles; no proprietary map key.</p>
      </div>
      <Suspense fallback={<Skeleton className="h-28" />}>
        <FilterBar countries={getCountries()} cities={getCities(filters.country)} streams={getStreams()} />
      </Suspense>
      {sites.length ? <StreamMap sites={sites} /> : <EmptyState title="No sites to map" body="Adjust filters to load monitoring locations." />}
    </div>
  );
}
