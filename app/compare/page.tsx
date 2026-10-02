import Link from "next/link";
import { CompareBars } from "@/components/charts/charts";
import { Card, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getSiteAnalytics, getSites } from "@/lib/data/queries";
import { parseFilters } from "@/lib/filters";
import { formatNumber, formatPercent } from "@/lib/utils";
import { ComparePicker } from "@/components/sites/compare-picker";

export const metadata = { title: "Compare" };

export default async function ComparePage({ searchParams }: PageProps<"/compare">) {
  const sp = await searchParams;
  const filters = parseFilters(sp as Record<string, string | string[] | undefined>);
  const raw = Array.isArray(sp.sites) ? sp.sites[0] : sp.sites;
  const ids = (raw ?? "").split(",").filter(Boolean).slice(0, 5);
  const all = getSites();
  const selected = (ids.length ? ids : []).map((id) => getSiteAnalytics(id, filters)).filter(Boolean);

  const chartData = selected.map((s) => ({
    name: s!.site.code,
    water: s!.components?.waterQuality,
    biodiversity: s!.components?.biodiversity,
    habitat: s!.components?.habitat,
    citizen: s!.components?.citizenSignal,
    environment: s!.components?.environmentalContext,
    composite: s!.composite.score,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-semibold">Compare sites</h1>
        <p className="text-sm text-muted-foreground">Select 2–5 sites. Differences are calculated from the same date window. Also use one site twice via time ranges in the URL.</p>
      </div>
      <ComparePicker sites={all.map((s) => ({ id: s.id, name: s.name, city: s.city }))} selected={ids} />
      {selected.length < 2 ? (
        <p className="text-sm text-muted-foreground">Choose at least two sites to calculate a comparison.</p>
      ) : (
        <>
          <CompareBars data={chartData} keys={["composite", "water", "biodiversity", "habitat"]} />
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="p-3">Site</th>
                  <th className="p-3">Composite</th>
                  <th className="p-3">Water</th>
                  <th className="p-3">Biodiversity</th>
                  <th className="p-3">Habitat</th>
                  <th className="p-3">Citizen</th>
                  <th className="p-3">Coverage</th>
                  <th className="p-3">Confidence</th>
                  <th className="p-3">Trend</th>
                </tr>
              </thead>
              <tbody>
                {selected.map((s) => (
                  <tr key={s!.site.id} className="border-t border-border">
                    <td className="p-3"><Link href={`/sites/${s!.site.id}`}>{s!.site.name}</Link><div className="mt-1"><StatusBadge status={s!.composite.status} /></div></td>
                    <td className="p-3">{formatNumber(s!.composite.score, 1)}</td>
                    <td className="p-3">{formatNumber(s!.components?.waterQuality ?? null, 1)}</td>
                    <td className="p-3">{formatNumber(s!.components?.biodiversity ?? null, 1)}</td>
                    <td className="p-3">{formatNumber(s!.components?.habitat ?? null, 1)}</td>
                    <td className="p-3">{formatNumber(s!.components?.citizenSignal ?? null, 1)}</td>
                    <td className="p-3">{s!.completeness.overall}%</td>
                    <td className="p-3 capitalize">{s!.confidence.level}</td>
                    <td className="p-3">{formatPercent(s!.trends.composite.percentChange)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Card>
            <CardTitle>Same site across time</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">Open a site and switch 7D / 30D / 90D / 1Y to compare the same location across windows. Example: <Link className="underline" href="/sites/site-1?range=30d">30 days</Link> vs <Link className="underline" href="/sites/site-1?range=1y">1 year</Link>.</p>
          </Card>
        </>
      )}
    </div>
  );
}
