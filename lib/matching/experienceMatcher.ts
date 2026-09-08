import type { ExperienceLevel } from "../../types";

const LEVEL_RANK: Record<ExperienceLevel, number> = {
  Beginner: 0,
  Intermediate: 1,
  Advanced: 2,
};

export interface ExperienceScore {
  /** 0-1 fit: balanced teams value mix, advanced fills leadership gaps. */
  score: number;
}

/**
 * Experience is deliberately NOT a strict ranking: intermediate scores
 * solidly everywhere, advanced earns a bonus only when the team lacks
 * senior coverage, beginners aren't shut out.
 */
export function scoreExperience(
  studentLevel: ExperienceLevel,
  teamHasAdvanced: boolean
): ExperienceScore {
  const base = studentLevel === "Advanced" ? 0.9 : studentLevel === "Intermediate" ? 0.8 : 0.6;
  const bonus = studentLevel === "Advanced" && !teamHasAdvanced ? 0.1 : 0;
  return { score: Math.min(1, base + bonus) };
}

export function rankOf(level: ExperienceLevel): number {
  return LEVEL_RANK[level];
}
