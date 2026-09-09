/**
 * Teams tests — run with:  npm run test:teams
 * (Plain Node via scripts/ts-resolve-loader.mjs; no test framework.)
 *
 * Covers capacity, member management, permissions, skill coverage,
 * and status handling against the session-scoped mock store.
 */
import {
  allowedStatuses,
  canLeaveTeam,
  canManageMembers,
  ensureTeamForProject,
  getTeamById,
  getTeamSkillGaps,
  isTeamFull,
  isTeamOwner,
  leaveTeam,
  openPositions,
  removeMember,
  teamStatusLabel,
  updateMemberRole,
  updateTeamStatus,
} from "../lib/services/teams";
import { mockStudents } from "../lib/mock/students";
import { mockProjects } from "../lib/mock/projects";
import { createProject } from "../lib/services/projects";
import type { Student, Team } from "../types/index";

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failed++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const byId = new Map<string, Student>(mockStudents.map((s) => [s.id, s]));

function fakeTeam(over: Partial<Team> = {}): Team {
  return {
    id: "fake",
    projectId: "x",
    projectTitle: "X",
    ownerId: "me",
    status: "Recruiting",
    members: [],
    maxMembers: 5,
    skillsCovered: [],
    progress: 0,
    deadline: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...over,
  } as Team;
}

// Capacity
{
  const t = fakeTeam({ members: [
    { studentId: "a", name: "A", role: "Dev", skills: [], matchScore: 0 },
    { studentId: "b", name: "B", role: "Dev", skills: [], matchScore: 0 },
    { studentId: "c", name: "C", role: "Dev", skills: [], matchScore: 0 },
    { studentId: "d", name: "D", role: "Dev", skills: [], matchScore: 0 },
  ] });
  check("Capacity — 4/5 → 1 open position", openPositions(t) === 1 && !isTeamFull(t));
  const full = fakeTeam({
    maxMembers: 5,
    members: ["a", "b", "c", "d", "e"].map((id) => ({ studentId: id, name: id, role: "Dev", skills: [], matchScore: 0 })),
  });
  check("Capacity — 5/5 → team complete", openPositions(full) === 0 && isTeamFull(full));
}

// Permissions
{
  const t = fakeTeam({ ownerId: "me", members: [{ studentId: "me", name: "Me", role: "Lead", skills: [], matchScore: 0 }] });
  check("Permissions — owner manages", isTeamOwner(t, "me") && canManageMembers(t, "me"));
  check("Permissions — member cannot manage", !canManageMembers(t, "other"));
  check("Permissions — owner cannot leave", !canLeaveTeam(t, "me"));
  const t2 = fakeTeam({
    ownerId: "priya",
    members: [
      { studentId: "priya", name: "P", role: "Lead", skills: [], matchScore: 0 },
      { studentId: "me", name: "Me", role: "Dev", skills: [], matchScore: 0 },
    ],
  });
  check("Permissions — member can leave", canLeaveTeam(t2, "me"));
  check("Permissions — stranger cannot leave", !canLeaveTeam(t2, "stranger"));
}

// Status labels + flow
{
  check("Status — recruiting label", teamStatusLabel(fakeTeam({ status: "Recruiting", maxMembers: 5, members: [] })).includes("Looking for 5"));
  check("Status — complete label", teamStatusLabel(fakeTeam({ status: "Team Complete" })) === "Team is full");
  check("Status — progress label", teamStatusLabel(fakeTeam({ status: "In Progress" })) === "Project work is underway");
  check("Status — completed label", teamStatusLabel(fakeTeam({ status: "Completed" })) === "Project completed");
  check("Status — flow excludes Completed from Recruiting", !allowedStatuses("Recruiting").includes("Completed"));
  check("Status — flow allows completion from In Progress", allowedStatuses("In Progress").includes("Completed"));
}

// Coverage: asset-management requires React/Node.js/PostgreSQL/UI/UX
{
  const project = mockProjects.find((p) => p.id === "asset-management")!;
  const team = fakeTeam({
    members: [
      { studentId: "me", name: "Alex Morgan", role: "Lead", skills: ["React", "TypeScript"], matchScore: 0 },
      { studentId: "john-michael", name: "John Michael", role: "Backend Developer", skills: ["Node.js", "PostgreSQL"], matchScore: 0 },
      { studentId: "priya-nair", name: "Priya Nair", role: "Frontend Developer", skills: ["React", "Supabase"], matchScore: 0 },
    ],
  });
  const gaps = getTeamSkillGaps(project, team, byId);
  const stateOf = (s: string) => gaps.find((g) => g.skill === s)?.status;
  check("Coverage — React fully covered (2 holders)", stateOf("React") === "covered");
  check("Coverage — Node.js covered (Advanced holder)", stateOf("Node.js") === "covered");
  check("Coverage — PostgreSQL partial (1 intermediate holder)", stateOf("PostgreSQL") === "partial");
  check("Coverage — UI/UX missing", stateOf("UI/UX") === "missing");
}

// Mutations against the session store
{
  const role = await updateMemberRole("team-asset", "john-michael", "Database Developer", "me");
  check(
    "Mutation — owner changes role",
    role.ok && role.team.members.find((m) => m.studentId === "john-michael")?.role === "Database Developer"
  );

  const denied = await removeMember("team-asset", "priya-nair", "grace-lee");
  check("Mutation — non-owner cannot remove", !denied.ok && denied.error === "NOT_OWNER");

  const ownerLeave = await leaveTeam("team-asset", "me");
  check("Mutation — owner cannot leave", !ownerLeave.ok && ownerLeave.error === "OWNER_CANNOT_LEAVE");

  const before = await getTeamById("team-expense");
  const left = await leaveTeam("team-expense", "me");
  check(
    "Mutation — member leaves",
    left.ok && left.team.members.length === (before?.members.length ?? 0) - 1,
    `before=${before?.members.length} after=${left.ok ? left.team.members.length : "?"}`
  );

  const status = await updateTeamStatus("team-health", "In Progress", "sarah-michael");
  check("Mutation — owner changes status", status.ok && status.team.status === "In Progress");

  const statusDenied = await updateTeamStatus("team-health", "Completed", "me");
  check("Mutation — member cannot change status", !statusDenied.ok && statusDenied.error === "NOT_OWNER");
}

// On-demand workspace creation (mock store)
{
  const created = await createProject(
    {
      title: "Ensure Team Test Project",
      description: "A project created to verify on-demand team workspace creation works end to end.",
      category: "Web Development",
      projectType: "Coursework",
      program: "Computer Science",
      year: "2",
      maxTeamSize: "4",
      requiredSkills: ["React"],
      interests: ["Web Development"],
      deadline: "2027-06-01",
    },
    { id: "me", name: "Alex Morgan" }
  );
  const first = await ensureTeamForProject(created.id, "me");
  check(
    "Ensure — creates team for owned project",
    first.ok && first.team.ownerId === "me" && first.team.members.length === 1 && first.team.maxMembers === 4
  );
  const second = await ensureTeamForProject(created.id, "me");
  check("Ensure — idempotent on second call", second.ok && second.team.id === (first.ok ? first.team.id : ""));
  const other = await createProject(
    {
      title: "Ensure Team Stranger Project",
      description: "A second project so the non-creator guard is tested on a teamless project.",
      category: "AI",
      projectType: "Research",
      program: "Computer Science",
      year: "3",
      maxTeamSize: "3",
      requiredSkills: ["Python"],
      interests: ["AI"],
      deadline: "2027-06-01",
    },
    { id: "me", name: "Alex Morgan" }
  );
  const stranger = await ensureTeamForProject(other.id, "sarah-michael");
  check("Ensure — non-creator blocked", !stranger.ok && stranger.error === "NOT_OWNER");
  const ghost = await ensureTeamForProject("no-such-project", "me");
  check("Ensure — unknown project blocked", !ghost.ok && ghost.error === "PROJECT_NOT_FOUND");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
