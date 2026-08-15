export type IntensityKey = "LOW" | "MODERATE" | "HIGH" | "ELITE";

type Tone = "success" | "amber" | "brand" | "danger";

/** Plain-language intensity labels — "MODERATE" is a database word, not a coach's. */
export const INTENSITY: Record<IntensityKey, { label: string; tone: Tone; blurb: string }> = {
  LOW: { label: "Easy", tone: "success", blurb: "Conversational the whole way through" },
  MODERATE: { label: "Steady", tone: "amber", blurb: "Working, but you can still count" },
  HIGH: { label: "Hard", tone: "brand", blurb: "Bring a towel and a plan for lunch" },
  ELITE: { label: "Elite", tone: "danger", blurb: "Technical, heavy, or both" },
};
