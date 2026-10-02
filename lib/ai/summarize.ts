import { renderDeterministicSummary } from "@/lib/insights/templates";
import type { StructuredInsight } from "@/types";

export async function summarizeInsight(payload: StructuredInsight): Promise<{ text: string; source: "ai" | "template" }> {
  const key = process.env.AI_API_KEY;
  const provider = process.env.AI_PROVIDER;
  if (!key || !provider) {
    return { text: renderDeterministicSummary(payload), source: "template" };
  }

  try {
    if (provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content:
                "You summarize structured AquaInsight analytics. Never invent numbers, observations, diseases, or causation. Mention uncertainty and confidence. Not a medical diagnosis.",
            },
            { role: "user", content: JSON.stringify(payload) },
          ],
        }),
      });
      if (!res.ok) throw new Error("ai");
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const text = json.choices?.[0]?.message?.content?.trim();
      if (text) return { text, source: "ai" };
    }
  } catch {
    return { text: renderDeterministicSummary(payload), source: "template" };
  }

  return { text: renderDeterministicSummary(payload), source: "template" };
}
