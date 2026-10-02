import type { StructuredInsight } from "@/types";

export function renderDeterministicSummary(input: StructuredInsight) {
  const parts: string[] = [];
  parts.push(`${input.site} (${input.period}).`);

  if (input.water_change !== null && input.water_change <= -10) {
    parts.push("Water-quality indicators have declined over the selected period.");
  } else if (input.water_change !== null && input.water_change >= 10) {
    parts.push("Water-quality indicators improved over the selected period.");
  }

  if (input.habitat_change !== null && input.habitat_change <= -5) {
    parts.push("Habitat indicators show deterioration.");
  }

  if (input.biodiversity_change !== null && input.biodiversity_change <= -5) {
    parts.push("Biodiversity indicators declined.");
  }

  if (input.pollution_change !== null && input.pollution_change >= 10) {
    parts.push("Pollution-related observations increased.");
  }

  const negatives = [input.water_change, input.habitat_change, input.biodiversity_change].filter(
    (v) => v !== null && v <= -5,
  ).length;
  if (negatives >= 2) {
    parts.push(
      "Multiple indicators show deterioration. Continued monitoring may help determine whether the pattern persists.",
    );
  }

  if (input.missing.length) {
    parts.push(`Missing: ${input.missing.join(", ")}. Confidence is therefore ${input.confidence}.`);
  } else {
    parts.push(`Confidence is ${input.confidence} based on available structured analytics.`);
  }

  parts.push(
    "These statements are generated from calculated indicator values only. They are not medical diagnoses and do not confirm causation.",
  );

  return parts.join(" ");
}
