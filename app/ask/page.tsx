import { askAquaInsight } from "@/lib/insights/ask";
import { parseFilters } from "@/lib/filters";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Ask AquaInsight" };

const EXAMPLES = [
  "Which monitoring sites have the most observations?",
  "Which sites show declining indicators?",
  "Which sites have insufficient data?",
  "Compare two monitoring sites.",
  "What changed at a particular site?",
];

export default async function AskPage({ searchParams }: PageProps<"/ask">) {
  const sp = await searchParams;
  const filters = parseFilters(sp as Record<string, string | string[] | undefined>);
  const question = typeof sp.q === "string" ? sp.q.trim() : "";
  const result = question ? askAquaInsight(question, filters) : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Safe question-answering</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Ask AquaInsight</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Explore the existing monitoring dataset using validated question patterns. No AI API key is required for the core experience.
        </p>
      </div>

      <Card>
        <CardTitle>Ask a question</CardTitle>
        <CardDesc>Use the query patterns below to explore conditions, trends, and monitoring priorities.</CardDesc>
        <form method="get" className="mt-4 space-y-4">
          <label className="block text-sm font-medium">
            <span className="mb-2 block">Question</span>
            <input name="q" defaultValue={question} placeholder="Which sites show declining indicators?" className="w-full rounded-xl border border-border bg-background px-3 py-2" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">Submit</button>
            <a href="/ask" className="rounded-full border border-border px-4 py-2 text-sm">Reset</a>
          </div>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <a key={example} href={`/ask?q=${encodeURIComponent(example)}`} className="rounded-full border border-border px-3 py-1.5 text-xs">
              {example}
            </a>
          ))}
        </div>
      </Card>

      {result ? (
        <Card>
          <CardTitle>Answer</CardTitle>
          <p className="mt-3 text-sm leading-6">{result.interpretation}</p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  {Object.keys(result.rows[0] ?? {}).map((key) => (
                    <th key={key} className="p-2">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, index) => (
                  <tr key={`${result.kind}-${index}`} className="border-t border-border">
                    {Object.entries(row).map(([key, value]) => (
                      <td key={`${index}-${key}`} className="p-2">{value ?? "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Query pattern: {result.kind}. Data is sourced from the validated AquaInsight demo analytics layer, not an arbitrary external SQL executor.</p>
        </Card>
      ) : (
        <Card>
          <CardTitle>How to ask</CardTitle>
          <CardDesc>Try one of the example questions to explore the selected window. Unsupported questions will fall back to the best-supported site summary.</CardDesc>
        </Card>
      )}
    </div>
  );
}
