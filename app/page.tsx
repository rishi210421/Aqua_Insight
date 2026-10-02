import Link from "next/link";
import { ArrowRight, LineChart, MapPinned, ShieldCheck, Sparkles } from "lucide-react";
import { getDashboardSummary } from "@/lib/data/queries";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatNumber } from "@/lib/utils";

export default function HomePage() {
  const summary = getDashboardSummary({ range: "30d" });
  const preview = summary.sites.slice(0, 3);

  return (
    <div>
      <section className="border-b border-border bg-[radial-gradient(circle_at_top_left,#d7ebe8,transparent_40%),radial-gradient(circle_at_80%_0%,#efe6d4,transparent_35%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">OneAquaHealth · Track 2 — Data-to-Insight</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight md:text-6xl">AquaInsight</h1>
            <p className="mt-4 text-xl text-muted-foreground">From stream data to actionable One Health intelligence.</p>
            <p className="mt-4 max-w-xl text-base leading-7">
              Transform citizen observations and environmental indicators into understandable maps, trends, comparisons and evidence-based ecosystem insights.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/sites" className="inline-flex h-12 items-center rounded-full bg-primary px-6 text-primary-foreground">
                Explore Stream Health
              </Link>
              <Link href="/dashboard" className="inline-flex h-12 items-center rounded-full border border-border bg-card px-6">
                View Live Dashboard
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">Streams generate data. AquaInsight turns that data into understanding.</p>
          </div>
          <div className="rounded-3xl border border-border bg-card/90 p-6 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Interactive preview · Demo dataset</p>
            <div className="mt-4 space-y-3">
              {preview.map((s) => (
                <Link key={s.site.id} href={`/sites/${s.site.id}`} className="block rounded-2xl border border-border p-4 hover:bg-muted/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{s.site.name}</p>
                      <p className="text-xs text-muted-foreground">{s.site.city} · {s.site.streamName}</p>
                    </div>
                    <StatusBadge status={s.composite.status} />
                  </div>
                  <p className="mt-2 text-sm">Composite {formatNumber(s.composite.score, 1)} / 100 · Confidence {s.confidence.level}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">The problem</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            Stream data is hard to interpret. Citizen observations, water-quality readings and habitat notes rarely show patterns, risks or health-relevant change on their own.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">The solution</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            AquaInsight is a data-to-insight layer: clean, normalize, analyse spatially and temporally, attach confidence, then explain what changed and where to monitor next.
          </p>
        </div>
      </section>

      <section className="border-y border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-5">
            {[
              "Raw citizen / environmental data",
              "Cleaning & normalization",
              "Spatial + temporal analytics",
              "Confidence-aware indicators",
              "Explainable One Health context",
            ].map((step, i) => (
              <li key={step} className="rounded-2xl border border-border bg-background p-4">
                <p className="text-xs text-muted-foreground">0{i + 1}</p>
                <p className="mt-2 font-medium">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-semibold">Key capabilities</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: MapPinned, title: "Maps & hotspots", body: "See where attention is concentrating without claiming unvalidated pollution events." },
            { icon: LineChart, title: "Trends & what changed", body: "Compare equivalent periods. Insufficient data is stated, not guessed." },
            { icon: ShieldCheck, title: "Confidence first", body: "Scores always travel with coverage, recency and missing-indicator notes." },
            { icon: Sparkles, title: "Ask + reports", body: "Natural-language exploration uses validated query patterns, not arbitrary SQL." },
          ].map((c) => (
            <div key={c.title} className="rounded-2xl border border-border p-5">
              <c.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <h2 className="text-2xl font-semibold">One Health, carefully stated</h2>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          Urban stream condition can be relevant to ecosystem health, biodiversity and community well-being. AquaInsight does not diagnose disease, predict illness, or claim that water will make people sick. It surfaces environmental evidence for monitoring decisions.
        </p>
        <Link href="/about" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
          Why Track 2? <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">Data sources</h2>
            <p className="mt-3 text-muted-foreground">This running prototype uses a labelled Demo/Synthetic Dataset. Public basemaps are OpenStreetMap-compatible. When Supabase is connected, the same schema can host imported tables.</p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Methodology</h2>
            <p className="mt-3 text-muted-foreground">The AquaInsight Composite Stream Health Indicator is a prototype (water quality 30%, biodiversity 25%, habitat 20%, citizen signal 15%, environmental context 10%). It is not an official OneAquaHealth score.</p>
            <Link href="/methodology" className="mt-3 inline-flex text-sm font-medium text-primary">Read the methodology</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
