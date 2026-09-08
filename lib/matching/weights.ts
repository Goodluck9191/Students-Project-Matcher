/**
 * Stage 6 scoring model weights (must sum to 1).
 * Kept in one place so tuning never scatters magic numbers.
 *
 * AI-ready note: a future AI layer can consume the same per-dimension
 * 0-1 scores (see MatchBreakdown) to generate richer explanations
 * without changing this contract.
 */

export const MATCH_WEIGHTS = {
  skill: 0.4,
  interest: 0.2,
  availability: 0.15,
  program: 0.1,
  experience: 0.1,
  year: 0.05,
} as const;

export type MatchWeightKey = keyof typeof MATCH_WEIGHTS;
