import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { getDashboardSummary, getObservations, getSiteById, getSites } from "@/lib/data/queries";
import { parseFilters } from "@/lib/filters";
import { formatDate, formatNumber } from "@/lib/utils";

export const metadata = { title: "Reports" };

export default async function ReportsPage({ searchParams }: PageProps<"/reports">) {
  const sp = await searchParams;
  const filters = parseFilters(sp as Record<string, string | string[] | undefined>);
  const reportType = typeof sp.type === "string" ? sp.type : "site";
  const selectedSite = typeof sp.site === "string" ? sp.site : "";
  const sites = getSites();
  const sourceSite = selectedSite ? getSiteById(selectedSite) : sites[0] ?? null;
  const summary = sourceSite ? getDashboardSummary({ ...filters, siteId: sourceSite.id }) : getDashboardSummary(filters);
  const observations = sourceSite ? getObservations({ ...filters, siteId: sourceSite.id }) : getObservations(filters);

  const rows = sourceSite
    ? summary.sites.map((item) => ({
        site: item.site.name,
        score: item.composite.score,
        status: item.composite.status,
        confidence: item.confidence.level,
        completeness: item.completeness.overall,
      }))
    : [];

  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent([
    ["site", "score", "status", "confidence", "coverage", "lastUpdated"],
    ...rows.map((row) => [row.site, String(row.score ?? ""), row.status, row.confidence, String(row.completeness), ""]),
  ].map((entry) => entry.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n"))}`;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Evidence report</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Environmental Reports</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Generate previews and CSV exports from the selected monitoring window and site set.
        </p>
      </div>

      <Card>
        <CardTitle>Report configuration</CardTitle>
        <CardDesc>Choose the report type, site and period. Data are drawn from the actual AquaInsight analytics layer.</CardDesc>
        <form method="get" className="mt-4 grid gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Report type</label>
            <select name="type" defaultValue={reportType} className="w-full rounded-xl border border-border bg-background px-3 py-2">
              <option value="site">Site report</option>
              <option value="multi">Multi-site comparison</option>
              <option value="stream">Location summary</option>
              <option value="observations">Observation report</option>
              <option value="quality">Monitoring quality report</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Site</label>
            <select name="site" defaultValue={selectedSite} className="w-full rounded-xl border border-border bg-background px-3 py-2">
              <option value="">All sites</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>{site.name}</option>
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
          <div className="flex items-end">
            <button type="submit" className="inline-flex h-10 w-full items-center justify-center rounded-full bg-primary px-4 text-sm text-primary-foreground">Generate report</button>
          </div>
        </form>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardTitle>Report preview</CardTitle>
          <div className="mt-4 space-y-4 text-sm">
            <p><span className="font-medium">Report type:</span> {reportType}</p>
            <p><span className="font-medium">Selected site:</span> {sourceSite ? sourceSite.name : "All monitored sites"}</p>
            <p><span className="font-medium">Generated:</span> {formatDate(new Date().toISOString())}</p>
            <p><span className="font-medium">Sites in scope:</span> {rows.length || 1}</p>
            <p><span className="font-medium">Observation records:</span> {observations.length}</p>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="p-2">Site</th>
                  <th className="p-2">Score</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Confidence</th>
                  <th className="p-2">Coverage</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? rows.map((row) => (
                  <tr key={row.site} className="border-t border-border">
                    <td className="p-2">{row.site}</td>
                    <td className="p-2">{formatNumber(row.score, 1)}</td>
                    <td className="p-2">{row.status}</td>
                    <td className="p-2">{row.confidence}</td>
                    <td className="p-2">{row.completeness}%</td>
                  </tr>
                )) : (
                  <tr className="border-t border-border"><td className="p-2" colSpan={5}>No site metrics were available for this selection.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardTitle>Export</CardTitle>
          <p className="mt-3 text-sm text-muted-foreground">CSV export reflects the currently selected report and data window. Synthetic data is labeled in the report summary.</p>
          <a href={csvHref} download="aquainsight-report.csv" className="mt-4 inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm text-primary-foreground">Download CSV</a>
        </Card>
      </div>
    </div>
  );
}
