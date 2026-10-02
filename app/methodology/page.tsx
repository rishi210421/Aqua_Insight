import { getSources } from "@/lib/data/queries";
import { DEFAULT_WEIGHTS, INDICATOR_HELP, INDICATOR_LABELS } from "@/lib/config";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Methodology" };

const workflow = [
  "Data sources",
  "Validation and normalization",
  "Indicator calculations",
  "Temporal and spatial analysis",
  "Confidence assessment",
  "Insight generation",
];

export default function MethodologyPage() {
  const sources = getSources();

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Scientific transparency</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Methodology</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          AquaInsight converts environmental observations and indicator snapshots into a composite view of stream health, signal confidence, and monitoring priorities.
        </p>
      </div>

      <Card>
        <CardTitle>Overview</CardTitle>
        <CardDesc>Prototype workflow. The app does not diagnose disease or infer causal health impacts from environmental signals alone.</CardDesc>
        <ol className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {workflow.map((step, index) => (
            <li key={step} className="rounded-xl border border-border bg-muted/30 p-3 text-sm">
              <span className="text-xs text-muted-foreground">0{index + 1}</span>
              <p className="mt-2 font-medium">{step}</p>
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        <CardTitle>Data sources</CardTitle>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {sources.map((source) => (
            <div key={source.id} className="rounded-xl border border-border p-4 text-sm">
              <p className="font-semibold">{source.sourceName}</p>
              <p className="mt-2 text-muted-foreground">Dataset: {source.description}</p>
              <ul className="mt-3 space-y-1 text-muted-foreground">
                <li>Type: {source.dataType}</li>
                <li>Retrieved: {source.retrievedAt}</li>
                <li>License: {source.license}</li>
                <li>Synthetic: {source.isSynthetic ? "Yes" : "No"}</li>
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle>Indicators</CardTitle>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(Object.keys(INDICATOR_HELP) as Array<keyof typeof INDICATOR_HELP>).map((key) => (
            <div key={key} className="rounded-xl border border-border p-4">
              <p className="font-medium">{INDICATOR_LABELS[key]}</p>
              <p className="mt-2 text-sm text-muted-foreground">{INDICATOR_HELP[key]}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle>Composite indicator</CardTitle>
        <div className="mt-4 space-y-3 text-sm text-muted-foreground">
          <p>The AquaInsight composite score uses the following weights for available indicators:</p>
          <ul className="list-disc pl-5">
            {Object.entries(DEFAULT_WEIGHTS).map(([k, v]) => (
              <li key={k}><span className="font-medium text-foreground">{INDICATOR_LABELS[k as keyof typeof INDICATOR_LABELS]}</span>: {v * 100}%</li>
            ))}
          </ul>
          <p>Missing metrics are removed from the calculation rather than treated as zero. This keeps the score transparent and avoids overstating certainty where data coverage is incomplete.</p>
          <p className="font-medium text-foreground">Prototype note: this is not an official OneAquaHealth score.</p>
        </div>
      </Card>

      <Card>
        <CardTitle>Confidence and trend calculations</CardTitle>
        <div className="mt-4 space-y-3 text-sm text-muted-foreground">
          <p>Confidence is estimated from recent observation count, data completeness, recency, continuity and consistency. The application makes no claim of formal statistical calibration or certification.</p>
          <p>Trends compare the current analysis window to the immediately preceding equivalent period. Absolute and percentage change are shown alongside direction, and values are suppressed if there is not enough comparable data.</p>
        </div>
      </Card>

      <Card>
        <CardTitle>Hotspot detection</CardTitle>
        <p className="mt-4 text-sm text-muted-foreground">
          Potential monitoring hotspots are flagged using a combination of declining indicators, below-average composite scores, worsening pollution-related observations, and low confidence. These are presented as monitoring priorities, not confirmed environmental hazards.
        </p>
      </Card>

      <Card>
        <CardTitle>AI usage</CardTitle>
        <p className="mt-4 text-sm text-muted-foreground">
          The application is designed to work without external AI credentials. Any AI summarization remains optional and only supplements deterministic analytics; it does not replace the underlying environmental evidence.
        </p>
      </Card>

      <Card>
        <CardTitle>Limitations</CardTitle>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Demo or synthetic data is explicitly labeled and should not be treated as real operational monitoring records.</li>
          <li>Citizen observations contain uncertainty and variable quality, especially when validation is incomplete.</li>
          <li>Spatial coverage is limited to the seeded monitoring network and does not represent exhaustive watershed conditions.</li>
          <li>Indicators are prototype measures for stream-health interpretation and not medical or diagnostic signals.</li>
          <li>Missing fields are not interpreted as zero; they are reported as data gaps and lower confidence.</li>
        </ul>
      </Card>
    </div>
  );
}
