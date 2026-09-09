import type {
  Project,
  ProjectStatus,
  Student,
  Team,
  TeamActivityItem,
  TeamMember,
  TeamSkillGap,
} from "@/types";
import { mockTeamActivity, mockTeams } from "@/lib/mock/teams";
import { analyzeRequiredSkills, levelOf } from "@/lib/matching/skillMatcher";
import { postSystemMessage } from "./chat";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import {
  mapTeam,
  mapTeamMember,
  toDbStatus,
  type DbProject,
  type DbTeam,
  type DbTeamMember,
} from "@/lib/supabase/mappers";
import {
  disbandTeamAction,
  leaveTeamAction,
  removeMemberAction,
  updateMemberRoleAction,
  updateTeamStatusAction,
} from "@/lib/actions/teams";

/**
 * Team service — single swap point for persistence.
 *
 * Mock mode: session-scoped working copy (module memory + localStorage).
 * Supabase mode: reads via RLS; mutations via Server Actions (server-side
 * ownership/capacity checks). Skill-gap math reuses Stage 6 — unchanged.
 *
 * Production authorization is enforced server-side + RLS, never by these
 * client-callable helpers alone.
 */

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

const STORE_KEY = "pm.teams.session.v1";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

let sessionTeams: Team[] | null = null;
let sessionActivity: TeamActivityItem[] | null = null;

function seed(): { teams: Team[]; activity: TeamActivityItem[] } {
  if (isBrowser()) {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { teams: Team[]; activity: TeamActivityItem[] };
        if (Array.isArray(parsed.teams)) return parsed;
      }
    } catch {
      // fall through to mock seed
    }
  }
  return { teams: clone(mockTeams), activity: clone(mockTeamActivity) };
}

function store(): { teams: Team[]; activity: TeamActivityItem[] } {
  if (!sessionTeams || !sessionActivity) {
    const seeded = seed();
    sessionTeams = seeded.teams;
    sessionActivity = seeded.activity;
  }
  return { teams: sessionTeams, activity: sessionActivity };
}

function persist(): void {
  if (!isBrowser() || !sessionTeams || !sessionActivity) return;
  try {
    window.localStorage.setItem(
      STORE_KEY,
      JSON.stringify({ teams: sessionTeams, activity: sessionActivity })
    );
  } catch {
    // Storage unavailable — session memory still works.
  }
}

function touch(team: Team, title: string, detail?: string): void {
  team.updatedAt = new Date().toISOString();
  sessionActivity?.unshift({
    id: `ta-${Date.now().toString(36)}`,
    teamId: team.id,
    title,
    detail,
    createdAt: new Date().toISOString(),
  });
  // Mirror meaningful team events into Team Chat (system message).
  try {
    postSystemMessage(team.id, detail ? `${title} — ${detail}` : `${title}.`);
  } catch {
    // Chat store unavailable — activity log above is unaffected.
  }
  persist();
}

async function delay(ms = 300): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Supabase read path: teams + rosters + names + project context. */
async function listTeamsDb(): Promise<Team[]> {
  const supabase = createClient();
  const [{ data: teams }, { data: members }, { data: profiles }, { data: projects }] =
    await Promise.all([
      supabase.from("teams").select("*").order("updated_at", { ascending: false }),
      supabase.from("team_members").select("*"),
      supabase.from("profiles").select("id, full_name, skills"),
      supabase.from("projects").select("id, name, required_team_size, deadline"),
    ]);
  const names = new Map(
    ((profiles ?? []) as { id: string; full_name: string | null }[]).map((p) => [p.id, p.full_name ?? "Unknown"])
  );
  const skillsByUser = new Map(
    ((profiles ?? []) as { id: string; skills: unknown }[]).map((p) => [
      p.id,
      Array.isArray(p.skills) ? (p.skills as string[]) : [],
    ])
  );
  const projectById = new Map(
    ((projects ?? []) as Pick<DbProject, "id" | "name" | "required_team_size" | "deadline">[]).map((p) => [p.id, p])
  );
  const membersByTeam = new Map<string, TeamMember[]>();
  for (const m of ((members ?? []) as DbTeamMember[])) {
    const list = membersByTeam.get(m.team_id) ?? [];
    const member = mapTeamMember(m, names.get(m.user_id) ?? "Unknown");
    member.skills = skillsByUser.get(m.user_id) ?? [];
    list.push(member);
    membersByTeam.set(m.team_id, list);
  }
  return ((teams ?? []) as DbTeam[]).map((t) => {
    const project = projectById.get(t.project_id);
    const team = mapTeam(t, membersByTeam.get(t.id) ?? [], project?.name ?? "Project");
    team.maxMembers = project?.required_team_size ?? 8;
    team.deadline = project?.deadline ?? t.updated_at;
    return team;
  });
}

export async function listTeams(): Promise<Team[]> {
  if (isSupabaseConfigured()) return listTeamsDb();
  await delay();
  return clone(store().teams);
}

export async function listMyTeams(userId: string): Promise<Team[]> {
  if (isSupabaseConfigured()) {
    return (await listTeamsDb()).filter((t) => t.members.some((m) => m.studentId === userId));
  }
  await delay(250);
  return clone(store().teams.filter((t) => t.members.some((m) => m.studentId === userId)));
}

export async function getTeamById(id: string): Promise<Team | null> {
  if (isSupabaseConfigured()) {
    return (await listTeamsDb()).find((t) => t.id === id) ?? null;
  }
  await delay(250);
  return clone(store().teams.find((t) => t.id === id) ?? null);
}

export async function getTeamForProject(projectId: string): Promise<Team | undefined> {
  if (isSupabaseConfigured()) {
    return (await listTeamsDb()).find((t) => t.projectId === projectId);
  }
  await delay(200);
  const found = store().teams.find((t) => t.projectId === projectId);
  return found ? clone(found) : undefined;
}

export async function getTeamActivity(teamId: string): Promise<TeamActivityItem[]> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data } = await supabase
      .from("team_messages")
      .select("id, content, created_at")
      .eq("team_id", teamId)
      .eq("message_type", "system")
      .order("created_at", { ascending: false });
    return ((data ?? []) as { id: string; content: string; createdAt?: string; created_at: string }[]).map((m) => ({
      id: m.id,
      teamId,
      title: m.content,
      createdAt: m.created_at,
    }));
  }
  await delay(200);
  return clone(store().activity.filter((a) => a.teamId === teamId));
}

/** Admin view: every team activity event, newest first. */
export async function listAllTeamActivity(): Promise<TeamActivityItem[]> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data } = await supabase
      .from("team_messages")
      .select("id, team_id, content, created_at")
      .eq("message_type", "system")
      .order("created_at", { ascending: false })
      .limit(200);
    return ((data ?? []) as { id: string; team_id: string; content: string; created_at: string }[]).map((m) => ({
      id: m.id,
      teamId: m.team_id,
      title: m.content,
      createdAt: m.created_at,
    }));
  }
  await delay(200);
  return clone([...store().activity].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ));
}

/* ------------------------------ permissions ------------------------------ */

export function isTeamOwner(team: Team, userId: string): boolean {
  return team.ownerId === userId;
}

export function canManageMembers(team: Team, userId: string): boolean {
  return isTeamOwner(team, userId);
}

/** Owners must transfer ownership (not in Stage 7) before leaving. */
export function canLeaveTeam(team: Team, userId: string): boolean {
  return team.members.some((m) => m.studentId === userId) && !isTeamOwner(team, userId);
}

/* ------------------------------- capacity -------------------------------- */

export function openPositions(team: Team): number {
  return Math.max(0, team.maxMembers - team.members.length);
}

export function isTeamFull(team: Team): boolean {
  return team.members.length >= team.maxMembers;
}

export function teamStatusLabel(team: Team): string {
  switch (team.status) {
    case "Recruiting":
      return `Looking for ${openPositions(team)} more member${openPositions(team) === 1 ? "" : "s"}`;
    case "Team Complete":
      return "Team is full";
    case "In Progress":
      return "Project work is underway";
    case "Completed":
      return "Project completed";
    case "Archived":
      return "Archived";
  }
}

/* ------------------------------- mutations ------------------------------- */

export type TeamMutationError =
  | "NOT_OWNER"
  | "OWNER_CANNOT_LEAVE"
  | "NOT_A_MEMBER"
  | "MEMBER_NOT_FOUND"
  | "ALREADY_MEMBER"
  | "TEAM_FULL"
  | "TEAM_NOT_FOUND";

/** Reopen a full team when space frees up. */
function maybeReopen(team: Team): void {
  if (team.status === "Team Complete" && team.members.length < team.maxMembers) {
    team.status = "Recruiting";
    touch(team, "Project status changed to Recruiting");
  }
}

/**
 * Add a member (used by the request accept flow). Flips the team to
 * Team Complete when the final seat fills.
 */
export async function addTeamMember(
  teamId: string,
  member: TeamMember
): Promise<{ ok: true; team: Team } | { ok: false; error: TeamMutationError }> {
  await delay(400);
  const team = store().teams.find((t) => t.id === teamId);
  if (!team) return { ok: false, error: "TEAM_NOT_FOUND" };
  if (team.members.some((m) => m.studentId === member.studentId))
    return { ok: false, error: "ALREADY_MEMBER" };
  if (isTeamFull(team)) return { ok: false, error: "TEAM_FULL" };
  team.members.push({ ...member, status: member.status ?? "active" });
  touch(team, `${member.name} joined the team`, member.role);
  if (isTeamFull(team)) {
    team.status = "Team Complete";
    touch(team, "Project status changed to Team Complete");
  }
  return { ok: true, team: clone(team) };
}

type MutationResult = { ok: true; team: Team } | { ok: false; error: TeamMutationError };

async function refreshTeam(teamId: string): Promise<Team> {
  const team = await getTeamById(teamId);
  if (!team) throw new Error("Team was updated but couldn't be reloaded.");
  return team;
}

export async function updateMemberRole(
  teamId: string,
  studentId: string,
  role: string,
  actorId: string
): Promise<MutationResult> {
  if (isSupabaseConfigured()) {
    const res = await updateMemberRoleAction(teamId, studentId, role);
    if (!res.ok) return { ok: false, error: res.code === "FORBIDDEN" ? "NOT_OWNER" : "TEAM_NOT_FOUND" };
    return { ok: true, team: await refreshTeam(teamId) };
  }
  await delay(400);
  const team = store().teams.find((t) => t.id === teamId);
  if (!team) return { ok: false, error: "TEAM_NOT_FOUND" };
  if (!canManageMembers(team, actorId)) return { ok: false, error: "NOT_OWNER" };
  const member = team.members.find((m) => m.studentId === studentId);
  if (!member) return { ok: false, error: "MEMBER_NOT_FOUND" };
  member.role = role;
  touch(team, `${member.name} was assigned ${role}`);
  return { ok: true, team: clone(team) };
}

export async function removeMember(
  teamId: string,
  studentId: string,
  actorId: string
): Promise<MutationResult> {
  if (isSupabaseConfigured()) {
    const res = await removeMemberAction(teamId, studentId);
    if (!res.ok) return { ok: false, error: res.code === "FORBIDDEN" ? "NOT_OWNER" : "TEAM_NOT_FOUND" };
    return { ok: true, team: await refreshTeam(teamId) };
  }
  await delay(400);
  const team = store().teams.find((t) => t.id === teamId);
  if (!team) return { ok: false, error: "TEAM_NOT_FOUND" };
  if (!canManageMembers(team, actorId)) return { ok: false, error: "NOT_OWNER" };
  const member = team.members.find((m) => m.studentId === studentId);
  if (!member) return { ok: false, error: "MEMBER_NOT_FOUND" };
  if (member.studentId === team.ownerId) return { ok: false, error: "NOT_OWNER" };
  team.members = team.members.filter((m) => m.studentId !== studentId);
  touch(team, `${member.name} was removed from the team`);
  maybeReopen(team);
  return { ok: true, team: clone(team) };
}

export async function leaveTeam(
  teamId: string,
  userId: string
): Promise<MutationResult> {
  if (isSupabaseConfigured()) {
    const res = await leaveTeamAction(teamId);
    if (!res.ok) return { ok: false, error: res.code === "FORBIDDEN" ? "OWNER_CANNOT_LEAVE" : "NOT_A_MEMBER" };
    return { ok: true, team: await refreshTeam(teamId) };
  }
  await delay(400);
  const team = store().teams.find((t) => t.id === teamId);
  if (!team) return { ok: false, error: "TEAM_NOT_FOUND" };
  if (isTeamOwner(team, userId)) return { ok: false, error: "OWNER_CANNOT_LEAVE" };
  if (!team.members.some((m) => m.studentId === userId))
    return { ok: false, error: "NOT_A_MEMBER" };
  team.members = team.members.filter((m) => m.studentId !== userId);
  touch(team, "A member left the team");
  maybeReopen(team);
  return { ok: true, team: clone(team) };
}

const STATUS_FLOW: Record<ProjectStatus, ProjectStatus[]> = {
  Recruiting: ["Recruiting", "Team Complete", "In Progress"],
  "Team Complete": ["Team Complete", "In Progress", "Recruiting"],
  "In Progress": ["In Progress", "Completed", "Recruiting"],
  Completed: ["Completed", "In Progress"],
  Archived: ["Archived"],
};

export function allowedStatuses(current: ProjectStatus): ProjectStatus[] {
  return STATUS_FLOW[current];
}

export async function updateTeamStatus(
  teamId: string,
  status: ProjectStatus,
  actorId: string,
  opts?: { asAdmin?: boolean }
): Promise<MutationResult> {
  if (isSupabaseConfigured()) {
    const res = await updateTeamStatusAction(teamId, toDbStatus(status), opts?.asAdmin);
    if (!res.ok) return { ok: false, error: res.code === "FORBIDDEN" ? "NOT_OWNER" : "TEAM_NOT_FOUND" };
    return { ok: true, team: await refreshTeam(teamId) };
  }
  await delay(400);
  const team = store().teams.find((t) => t.id === teamId);
  if (!team) return { ok: false, error: "TEAM_NOT_FOUND" };
  if (!opts?.asAdmin && !canManageMembers(team, actorId))
    return { ok: false, error: "NOT_OWNER" };
  team.status = status;
  touch(team, `Project status changed to ${status}`);
  return { ok: true, team: clone(team) };
}

/**
 * Admin-only: remove a team entirely (members keep their profiles;
 * dangling request links degrade gracefully to the requests inbox).
 */
export async function disbandTeam(
  teamId: string
): Promise<{ ok: true } | { ok: false; error: TeamMutationError }> {
  if (isSupabaseConfigured()) {
    const res = await disbandTeamAction(teamId);
    if (!res.ok) return { ok: false, error: "TEAM_NOT_FOUND" };
    return { ok: true };
  }
  await delay(400);
  const idx = store().teams.findIndex((t) => t.id === teamId);
  if (idx < 0) return { ok: false, error: "TEAM_NOT_FOUND" };
  const [removed] = store().teams.splice(idx, 1);
  if (sessionActivity) {
    sessionActivity.unshift({
      id: `ta-${Date.now().toString(36)}`,
      teamId,
      title: `${removed.projectTitle} was disbanded by an administrator`,
      createdAt: new Date().toISOString(),
    });
  }
  persist();
  return { ok: true };
}

/* ------------------------------- coverage -------------------------------- */

/**
 * Per-skill gap states for the workspace. Required-vs-team analysis reuses
 * Stage 6 `analyzeRequiredSkills`; holder counts add the covered/partial/
 * missing nuance (≥2 holders or one Advanced holder → covered).
 */
export function getTeamSkillGaps(
  project: Pick<Project, "requiredSkills">,
  team: Team,
  studentsById: Map<string, Student>
): TeamSkillGap[] {
  const teamSkills = [...new Set(team.members.flatMap((m) => m.skills))];
  const { missing } = analyzeRequiredSkills(project.requiredSkills, teamSkills);

  return project.requiredSkills.map((skill) => {
    const holders = team.members.filter((m) => m.skills.includes(skill));
    const advanced = holders.some(
      (m) =>
        levelOf(studentsById.get(m.studentId)?.skillLevels, skill) === "Advanced"
    );
    if (missing.includes(skill)) {
      // Skill absent from the team entirely — but a single holder edge case
      // can't happen here since missing ⟺ zero holders.
      return { skill, status: "missing" as const, holders: 0 };
    }
    const status = holders.length >= 2 || advanced ? "covered" : "partial";
    return { skill, status, holders: holders.length };
  });
}

/** Enrich a member with profile data via id lookup (no record duplication). */
export function enrichMember(
  member: TeamMember,
  studentsById: Map<string, Student>
): TeamMember {
  const profile = studentsById.get(member.studentId);
  if (!profile) return member;
  return {
    ...member,
    program: member.program ?? profile.program,
    year: member.year ?? profile.year,
    availability: member.availability ?? profile.availability,
  };
}
