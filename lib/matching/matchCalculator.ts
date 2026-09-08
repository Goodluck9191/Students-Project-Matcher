import type {
  MatchBreakdown,
  MatchRecommendation,
  Project,
  Student,
  Team,
} from "../../types";
import { MATCH_WEIGHTS } from "./weights";
import { getMatchTier } from "./score";
import { analyzeRequiredSkills, scoreSkills } from "./skillMatcher";
import { scoreInterests } from "./interestMatcher";
import { scoreAvailability } from "./availabilityMatcher";
import { scoreExperience } from "./experienceMatcher";
import { scoreAcademic } from "./academicMatcher";
import { analyzeTeam, type TeamSkillState } from "./teamBalancer";

export interface MatchContext {
  project: Project;
  /** Current team record (undefined when the project has no team yet). */
  team: Team | undefined;
  /** All known students keyed for availability/experience lookups. */
  studentsById: Map<string, Student>;
  currentUserId: string;
}

export interface MatchResult {
  /** Top-level eligibility outcome. */
  teamFull: boolean;
  teamState: TeamSkillState;
  recommendations: MatchRecommendation[];
}

function teamMemberMaps(team: Team | undefined, studentsById: Map<string, Student>) {
  const availability = new Map<string, readonly string[]>();
  const experience = new Map<string, "Beginner" | "Intermediate" | "Advanced">();
  for (const m of team?.members ?? []) {
    const s = studentsById.get(m.studentId);
    if (s) {
      availability.set(m.studentId, s.availability);
      experience.set(m.studentId, s.experienceLevel);
    }
  }
  return { availability, experience };
}

function buildReasons(args: {
  skill: { missingCovered: string[]; matchingCovered: string[] };
  interests: string[];
  availability: string[];
  programScore: number;
  experienceLabel: string;
}): string[] {
  const reasons: string[] = [];
  for (const s of args.skill.missingCovered.slice(0, 2))
    reasons.push(`Fills the ${s} skill gap in your team`);
  if (args.skill.matchingCovered.length > 0)
    reasons.push(`Matches required skill${args.skill.matchingCovered.length > 1 ? "s" : ""}: ${args.skill.matchingCovered.slice(0, 2).join(", ")}`);
  if (args.interests.length > 0)
    reasons.push(`Shares ${args.interests.length} project interest${args.interests.length > 1 ? "s" : ""}: ${args.interests.slice(0, 2).join(", ")}`);
  if (args.availability.length > 0)
    reasons.push(`Available ${args.availability.slice(0, 3).join(" · ").toLowerCase()}`);
  if (args.programScore >= 1) reasons.push("Same academic program as the project");
  reasons.push(`${args.experienceLabel} experience`);
  return reasons.slice(0, 5);
}

/**
 * Deterministic rule-based matcher (Stage 6).
 * Pure function of (project, team, candidates) — no mock imports, so
 * Supabase rows can flow through the same path later. A future AI layer
 * can reuse MatchBreakdown + reasons as structured input.
 */
export function calculateMatches(
  ctx: MatchContext,
  candidates: Student[]
): MatchResult {
  const { project, team, studentsById, currentUserId } = ctx;
  const { availability, experience } = teamMemberMaps(team, studentsById);

  const teamState = analyzeTeam({
    requiredSkills: project.requiredSkills,
    team,
    memberAvailability: availability,
    memberExperience: experience,
    maxMembers: project.maxTeamSize,
  });

  if (teamState.isFull) {
    return { teamFull: true, teamState, recommendations: [] };
  }

  const memberIds = new Set((team?.members ?? []).map((m) => m.studentId));
  const eligible = candidates.filter(
    (s) => s.id !== currentUserId && !memberIds.has(s.id)
  );

  const recommendations = eligible.map((student): MatchRecommendation => {
    const skill = scoreSkills({
      required: project.requiredSkills,
      missing: teamState.missing,
      candidateSkills: student.skills,
      candidateLevels: student.skillLevels,
    });
    const interest = scoreInterests(project.interests, student.interests);
    const avail = scoreAvailability(teamState.teamAvailability, student.availability);
    const academic = scoreAcademic(project.program, project.year, student.program, student.year);
    const exp = scoreExperience(student.experienceLevel, teamState.teamHasAdvanced);

    const breakdown: MatchBreakdown = {
      skill: skill.score,
      interest: interest.score,
      availability: avail.score,
      program: academic.program,
      experience: exp.score,
      year: academic.year,
    };

    const score = Math.round(
      (breakdown.skill * MATCH_WEIGHTS.skill +
        breakdown.interest * MATCH_WEIGHTS.interest +
        breakdown.availability * MATCH_WEIGHTS.availability +
        breakdown.program * MATCH_WEIGHTS.program +
        breakdown.experience * MATCH_WEIGHTS.experience +
        breakdown.year * MATCH_WEIGHTS.year) * 100
    );

    const complementary = student.skills.filter(
      (s) => !project.requiredSkills.includes(s)
    );

    return {
      student,
      score,
      tier: getMatchTier(score),
      matchingSkills: [...skill.missingCovered, ...skill.matchingCovered],
      complementarySkills: complementary,
      missingSkillsCovered: skill.missingCovered,
      matchingInterests: interest.matching,
      availabilityMatch: avail.score,
      breakdown,
      reasons: buildReasons({
        skill,
        interests: interest.matching,
        availability: avail.shared,
        programScore: academic.program,
        experienceLabel: student.experienceLevel,
      }),
    };
  });

  recommendations.sort((a, b) => b.score - a.score);
  return { teamFull: false, teamState, recommendations };
}

/** Re-export for UI convenience (gap summary without full calculation). */
export { analyzeRequiredSkills };
