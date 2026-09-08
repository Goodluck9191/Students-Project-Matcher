import { clamp } from "../utils";
import type { MatchTier } from "../../types";

/**
 * Shared match-tier helpers — UI + engine.
 * Tiers (Stage 6): 90+ Excellent · 75+ Strong · 60+ Good · 40+ Moderate · <40 Low.
 */

export type { MatchTier };

export function getMatchTier(score: number): MatchTier {
  if (score >= 90) return "excellent";
  if (score >= 75) return "strong";
  if (score >= 60) return "good";
  if (score >= 40) return "moderate";
  return "low";
}

export function tierStyles(tier: MatchTier): { label: string; classes: string; bar: string } {
  switch (tier) {
    case "excellent":
      return {
        label: "Excellent match",
        classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        bar: "bg-emerald-500",
      };
    case "strong":
      return {
        label: "Strong match",
        classes: "bg-teal-50 text-teal-700 ring-teal-200",
        bar: "bg-teal-500",
      };
    case "good":
      return {
        label: "Good match",
        classes: "bg-sky-50 text-sky-700 ring-sky-200",
        bar: "bg-sky-500",
      };
    case "moderate":
      return {
        label: "Moderate match",
        classes: "bg-amber-50 text-amber-700 ring-amber-200",
        bar: "bg-amber-500",
      };
    default:
      return {
        label: "Low match",
        classes: "bg-slate-100 text-slate-600 ring-slate-200",
        bar: "bg-slate-400",
      };
  }
}

/**
 * Weighted match score combiner. The Stage 6 engine (matchCalculator)
 * computes per-dimension 0-1 scores and combines them with MATCH_WEIGHTS;
 * this helper is kept for lightweight UI-side estimates.
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
