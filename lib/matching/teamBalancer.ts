import type { Team } from "../../types";
import { analyzeRequiredSkills, type SkillAnalysis } from "./skillMatcher";

export interface TeamSkillState extends SkillAnalysis {
  memberCount: number;
  maxMembers: number;
  isFull: boolean;
  /** Union of all current member skills. */
  teamSkills: string[];
  /** Union of member availability slots (lowercased raw values). */
  teamAvailability: string[];
  teamHasAdvanced: boolean;
  /** 0-1 coverage per required skill (1 member ≈ full for mock scale). */
  coverageBySkill: { skill: string; coverage: number }[];
}

/**
 * Derives the team's state from a project + its team record:
 * which required skills are covered, which are gaps, and the
 * availability/experience context matchers need.
 */
export function analyzeTeam(args: {
  requiredSkills: readonly string[];
  team: Team | undefined;
  memberAvailability: Map<string, readonly string[]>;
  memberExperience: Map<string, "Beginner" | "Intermediate" | "Advanced">;
  maxMembers: number;
}): TeamSkillState {
  const { requiredSkills, team, memberAvailability, memberExperience, maxMembers } = args;
  const members = team?.members ?? [];

  const teamSkills = [...new Set(members.flatMap((m) => m.skills))];
  const analysis = analyzeRequiredSkills(requiredSkills, teamSkills);

  const availability = [
    ...new Set(
      members.flatMap((m) => memberAvailability.get(m.studentId) ?? [])
    ),
  ];

  const teamHasAdvanced = members.some((m) => {
    const exp = memberExperience.get(m.studentId);
    const senior = exp === "Advanced" || /lead|senior/i.test(m.role);
    return senior;
  });

  const counts = new Map<string, number>();
  for (const s of teamSkills) counts.set(s, (counts.get(s) ?? 0) + 1);
  const coverageBySkill = requiredSkills.map((skill) => ({
    skill,
    coverage: Math.min(1, (counts.get(skill) ?? 0) / 1),
  }));

  return {
    ...analysis,
    memberCount: members.length,
    maxMembers,
    isFull: members.length >= maxMembers,
    teamSkills,
    teamAvailability: availability,
    teamHasAdvanced,
    coverageBySkill,
  };
}
