import type { Team } from "@/types";
import { mockTeams } from "@/lib/mock/teams";

/**
 * Team service — swap point for Supabase.
 * TODO (Supabase): `from("teams").select("*, team_members(*)")` with RLS.
 */
export async function listTeams(): Promise<Team[]> {
  await new Promise((r) => setTimeout(r, 300));
  return [...mockTeams];
}

export async function getTeamForProject(projectId: string): Promise<Team | undefined> {
  await new Promise((r) => setTimeout(r, 200));
  return mockTeams.find((t) => t.projectId === projectId);
}
