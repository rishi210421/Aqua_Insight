import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { getObservations, getSites, getStreams } from "@/lib/data/queries";
import { parseFilters } from "@/lib/filters";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Observations" };

export default async function ObservationsPage({ searchParams }: PageProps<"/observations">) {
  const sp = await searchParams;
  const filters = parseFilters(sp as Record<string, string | string[] | undefined>);
  const rawQ = typeof sp.q === "string" ? sp.q : "";
  const selectedSite = typeof sp.site === "string" ? sp.site : "";
  const selectedStream = typeof sp.stream === "string" ? sp.stream : "";
  const selectedCategory = typeof sp.category === "string" ? sp.category : "all";
  const selectedValidation = typeof sp.validation === "string" ? sp.validation : "all";
  const selectedObs = typeof sp.obs === "string" ? sp.obs : "";

  let observations = getObservations({ ...filters, q: rawQ || filters.q });
  if (selectedSite) observations = observations.filter((o) => o.siteId === selectedSite);
  if (selectedStream) {
    const streamSites = getSites({ streamId: selectedStream }).map((s) => s.id);
    observations = observations.filter((o) => streamSites.includes(o.siteId));
  }
  if (selectedCategory !== "all") {
    observations = observations.filter((o) => {
      const value = o[selectedCategory as keyof typeof o];
      return value != null && String(value).trim() !== "";
    });
  }
  if (selectedValidation !== "all") {
    observations = observations.filter((o) => o.dataQuality === selectedValidation);
  }

  const selected = observations.find((o) => o.id === selectedObs) ?? observations[0] ?? null;
  const allSites = getSites();
  const streamOptions = getStreams();
  const uniqueCities = [...new Set(observations.map((o) => o.city))].sort();

  const summary = {
    total: observations.length,
    sites: new Set(observations.map((o) => o.siteId)).size,
    newest: observations.reduce<string | null>((latest, observation) => {
      if (!latest || observation.observedAt > latest) return observation.observedAt;
      return latest;
    }, null),
    review: observations.filter((o) => o.dataQuality === "needs_review").length,
  };

  const csvRows = [
    ["id", "date", "site", "stream", "city", "category", "source", "status", "notes"],
    ...observations.map((o) => [
      o.id,
      o.observedAt,
      o.siteName,
      o.streamName,
      o.city,
      o.pollution ?? o.waterAppearance ?? o.biodiversity ?? "n/a",
      o.source,
      o.dataQuality,
      (o.notes ?? "").replace(/\n/g, " "),
    ]),
  ];
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csvRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n"))}`;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Demo / synthetic data</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Citizen Observations</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Explore environmental observations, monitoring records and reported changes across monitored stream sites.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total observations", summary.total],
          ["Monitored sites", summary.sites],
          ["Most recent", summary.newest ? formatDate(summary.newest) : "—"],
          ["Needs review", summary.review],
        ].map(([label, value]) => (
          <Card key={String(label)} className="p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{String(value)}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardTitle>Observation explorer</CardTitle>
        <CardDesc>Filters update the actual dataset. Search is case-insensitive and missing values are handled gracefully.</CardDesc>
        <form method="get" className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="xl:col-span-2">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Search</label>
            <input name="q" defaultValue={rawQ} className="w-full rounded-xl border border-border bg-background px-3 py-2" placeholder="Search site, stream or notes" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Site</label>
            <select name="site" defaultValue={selectedSite} className="w-full rounded-xl border border-border bg-background px-3 py-2">
              <option value="">All sites</option>
              {allSites.map((site) => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Stream</label>
            <select name="stream" defaultValue={selectedStream} className="w-full rounded-xl border border-border bg-background px-3 py-2">
              <option value="">All streams</option>
              {streamOptions.map((stream) => (
                <option key={stream.id} value={stream.id}>{stream.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Location</label>
            <select name="city" defaultValue={String(sp.city ?? "")} className="w-full rounded-xl border border-border bg-background px-3 py-2">
              <option value="">All locations</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Date range</label>
            <select name="range" defaultValue={String(filters.range ?? "30d")} className="w-full rounded-xl border border-border bg-background px-3 py-2">
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
              <option value="90d">90 days</option>
              <option value="1y">1 year</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Category</label>
            <select name="category" defaultValue={selectedCategory} className="w-full rounded-xl border border-border bg-background px-3 py-2">
              <option value="all">All categories</option>
              <option value="pollution">Pollution</option>
              <option value="waterAppearance">Water appearance</option>
              <option value="biodiversity">Biodiversity</option>
              <option value="vegetation">Vegetation</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Validation</label>
            <select name="validation" defaultValue={selectedValidation} className="w-full rounded-xl border border-border bg-background px-3 py-2">
              <option value="all">All records</option>
              <option value="validated">Validated</option>
              <option value="needs_review">Needs review</option>
              <option value="incomplete">Incomplete</option>
            </select>
          </div>
          <div className="flex items-end gap-2 xl:col-span-2">
            <Button type="submit" className="w-full">Apply filters</Button>
            <Link href="/observations" className="inline-flex h-10 items-center justify-center rounded-full border border-border px-4 text-sm">Reset</Link>
          </div>
        </form>
      </Card>

      {!observations.length ? (
        <EmptyState title="No observations match your selected filters." body="Try broadening the date range or resetting the filters." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Site</th>
                    <th className="p-3">Stream</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {observations.map((observation) => (
                    <tr key={observation.id} className={selected?.id === observation.id ? "bg-muted/30" : "border-t border-border"}>
                      <td className="p-3 align-top"><Link href={`/observations?${new URLSearchParams({ ...sp, obs: observation.id }).toString()}`} className="font-medium hover:underline">{formatDate(observation.observedAt)}</Link></td>
                      <td className="p-3 align-top">{observation.siteName}</td>
                      <td className="p-3 align-top">{observation.streamName}</td>
                      <td className="p-3 align-top">{observation.pollution ?? observation.waterAppearance ?? observation.biodiversity ?? "—"}</td>
                      <td className="p-3 align-top">{observation.dataQuality}</td>
                      <td className="p-3 align-top">{observation.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div>
            {selected ? (
              <Card>
                <CardTitle>Observation details</CardTitle>
                <dl className="mt-4 space-y-3 text-sm">
                  <div><dt className="text-muted-foreground">Observation ID</dt><dd>{selected.id}</dd></div>
                  <div><dt className="text-muted-foreground">Date</dt><dd>{formatDate(selected.observedAt)}</dd></div>
                  <div><dt className="text-muted-foreground">Site</dt><dd>{selected.siteName}</dd></div>
                  <div><dt className="text-muted-foreground">Stream</dt><dd>{selected.streamName}</dd></div>
                  <div><dt className="text-muted-foreground">Location</dt><dd>{selected.city}</dd></div>
                  <div><dt className="text-muted-foreground">Water appearance</dt><dd>{selected.waterAppearance ?? "—"}</dd></div>
                  <div><dt className="text-muted-foreground">Pollution</dt><dd>{selected.pollution ?? "—"}</dd></div>
                  <div><dt className="text-muted-foreground">Biodiversity</dt><dd>{selected.biodiversity ?? "—"}</dd></div>
                  <div><dt className="text-muted-foreground">Source</dt><dd>{selected.source}</dd></div>
                  <div><dt className="text-muted-foreground">Validation</dt><dd>{selected.dataQuality}</dd></div>
                  <div><dt className="text-muted-foreground">Notes</dt><dd>{selected.notes ?? "No notes recorded."}</dd></div>
                </dl>
              </Card>
            ) : (
              <ErrorState title="Unable to load observations." body="The selected query did not return any data for the requested window." />
            )}

            <Card className="mt-4">
              <CardTitle>Export current view</CardTitle>
              <a href={csvHref} download="aquainsight-observations.csv" className="mt-3 inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm text-primary-foreground">Download CSV</a>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
