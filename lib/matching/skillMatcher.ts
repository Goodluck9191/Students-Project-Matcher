import type { SkillProficiency, SkillWithLevel } from "../../types";

const LEVEL_MULTIPLIER: Record<SkillProficiency, number> = {
  Beginner: 0.75,
  Intermediate: 1,
  Advanced: 1.15,
};

export function levelMultiplier(level: SkillProficiency | undefined): number {
  return LEVEL_MULTIPLIER[level ?? "Intermediate"];
}

export function levelOf(levels: readonly SkillWithLevel[] | undefined, skill: string): SkillProficiency {
  return levels?.find((l) => l.skill === skill)?.level ?? "Intermediate";
}

export interface SkillAnalysis {
  required: string[];
  covered: string[];
  missing: string[];
}

export function analyzeRequiredSkills(required: readonly string[], teamSkills: readonly string[]): SkillAnalysis {
  const team = new Set(teamSkills);
  const covered = required.filter((s) => team.has(s));
  const missing = required.filter((s) => !team.has(s));
  return { required: [...required], covered, missing };
}

export interface SkillScore {
  /** 0-1 skill sub-score (gap-filling weighted above overlap). */
  score: number;
  /** Required-but-missing skills this candidate covers. */
  missingCovered: string[];
  /** Required skills already covered by the team that the candidate also has. */
  matchingCovered: string[];
}

/**
 * Complementary-first skill scoring:
 * - Covering a MISSING team skill scores full (× level multiplier).
 * - Merely overlapping an already-covered skill scores 0.3 (no level bonus),
 *   so clones of the existing team can't outrank gap-fillers.
 */
export function scoreSkills(args: {
  required: readonly string[];
  missing: readonly string[];
  candidateSkills: readonly string[];
  candidateLevels?: readonly SkillWithLevel[];
}): SkillScore {
  const { required, missing, candidateSkills, candidateLevels } = args;
  const missingSet = new Set(missing);
  const requiredSet = new Set(required);

  const missingCovered = candidateSkills.filter((s) => missingSet.has(s));
  const matchingCovered = candidateSkills.filter(
    (s) => requiredSet.has(s) && !missingSet.has(s)
  );

  const hitMissing = missingCovered.reduce(
    (sum, s) => sum + levelMultiplier(levelOf(candidateLevels, s)),
    0
  );
  const hitCovered = matchingCovered.length * 0.3;

  const coveredCount = required.length - missing.length;
  const denominator = Math.max(1, missing.length + 0.3 * coveredCount);

  return {
    score: Math.min(1, (hitMissing + hitCovered) / denominator),
    missingCovered,
    matchingCovered,
  };
}
