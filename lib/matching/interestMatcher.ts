export interface InterestScore {
  /** 0-1 overlap relative to the project's interests. */
  score: number;
  matching: string[];
}

export function scoreInterests(
  projectInterests: readonly string[],
  studentInterests: readonly string[]
): InterestScore {
  if (projectInterests.length === 0) return { score: 0.5, matching: [] };
  const wanted = new Set(projectInterests.map((s) => s.toLowerCase()));
  const matching = studentInterests.filter((s) => wanted.has(s.toLowerCase()));
  return {
    score: Math.min(1, matching.length / projectInterests.length),
    matching,
  };
}
