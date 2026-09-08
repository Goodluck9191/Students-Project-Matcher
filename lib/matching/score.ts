import { clamp } from "@/lib/utils";

/**
 * Pure matching helpers — kept separate from UI so the algorithm can
 * evolve (and later move server-side) without touching components.
 */

export type MatchTier = "excellent" | "good" | "moderate";

export function getMatchTier(score: number): MatchTier {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  return "moderate";
}

export function tierStyles(tier: MatchTier): { label: string; classes: string; bar: string } {
  switch (tier) {
    case "excellent":
      return {
        label: "Excellent match",
        classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        bar: "bg-emerald-500",
      };
    case "good":
      return {
        label: "Good match",
        classes: "bg-sky-50 text-sky-700 ring-sky-200",
        bar: "bg-sky-500",
      };
    default:
      return {
        label: "Moderate match",
        classes: "bg-amber-50 text-amber-700 ring-amber-200",
        bar: "bg-amber-500",
      };
  }
}

/**
 * Weighted match score placeholder (Stage 1).
 * Real implementation (Stage 6) combines skill overlap, complementary
 * coverage of missing skills, interests, availability, program/year.
 */
export function computeMatchScore(args: {
  skillOverlap: number;
  complementaryCover: number;
  interestOverlap: number;
  availabilityOverlap: number;
}): number {
  const { skillOverlap, complementaryCover, interestOverlap, availabilityOverlap } = args;
  const raw =
    skillOverlap * 0.3 +
    complementaryCover * 0.4 +
    interestOverlap * 0.15 +
    availabilityOverlap * 0.15;
  return clamp(Math.round(raw * 100));
}
