export interface AvailabilityScore {
  /** 0-1 overlap between team slots and student slots. */
  score: number;
  shared: string[];
}

/**
 * Scores the overlap of a student's availability with the union of the
 * existing team's slots. Empty team → neutral 0.6 (no penalty, no bonus).
 */
export function scoreAvailability(
  teamSlots: readonly string[],
  studentSlots: readonly string[]
): AvailabilityScore {
  if (teamSlots.length === 0) return { score: 0.6, shared: [] };
  const team = new Set(teamSlots.map((s) => s.toLowerCase()));
  const shared = studentSlots.filter((s) => team.has(s.toLowerCase()));
  return {
    score: Math.min(1, shared.length / Math.max(1, Math.min(teamSlots.length, 3))),
    shared,
  };
}
