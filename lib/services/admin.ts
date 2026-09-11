import type {
  Project,
  ProjectStatus,
  Student,
  Team,
} from "@/types";
import type { UserRole } from "./session";
import { canAccessAdmin } from "./session";
import { mockStudents, mockCurrentStudent } from "@/lib/mock/students";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { mapProfile, toDbStatus, type DbProfile } from "@/lib/supabase/mappers";
import { listAllProjects, setProjectStatus, deleteProject } from "./projects";
import { listTeams, updateTeamStatus, disbandTeam, getTeamSkillGaps } from "./teams";
import { listAllRequests } from "./requests";
import { listAllTeamActivity } from "./teams";
import { listStudents } from "./students";
import { deleteProjectAction, setProjectStatusAction } from "@/lib/actions/projects";
import {
  adminSaveSettingsAction,
  adminSetUserStatusAction,
} from "@/lib/actions/admin";
import { MATCH_WEIGHTS } from "@/lib/matching/weights";

/**
 * Admin analytics + management service (Stage 10).
 *
 * Every number derives from the SAME mock/service state students see
 * (projects/teams/requests services + student mocks) — no parallel
 * datasets, so admin figures stay consistent with the app.
 *
 * Mutations are role-gated here (`requireAdmin`); the underlying stores
 * are shared with student flows.
 *
 * TODO (Supabase): replace each getter with aggregate queries + RLS
 * (admin-only), mutations with audited server actions.
 */

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

const USER_OVERRIDE_KEY = "pm.admin.users.v1";
const SETTINGS_KEY = "pm.admin.settings.v1";

export type AccountStatus = "active" | "inactive";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  program: string;
  year: number;
  role: UserRole;
  accountStatus: AccountStatus;
  profileCompletion: number;
  teamName: string | null;
  projectCount: number;
  joinedAt: string;
}

interface UserOverrides {
  status: Record<string, AccountStatus>;
}

/** Module memory is canonical (works in Node/tests); localStorage mirrors it in browsers. */
let memoryOverrides: UserOverrides | null = null;

function readOverrides(): UserOverrides {
  if (memoryOverrides) return memoryOverrides;
  if (isBrowser()) {
    try {
      const raw = window.localStorage.getItem(USER_OVERRIDE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as UserOverrides;
        memoryOverrides = { status: parsed.status ?? {} };
        return memoryOverrides;
      }
    } catch {
      // ignore
    }
  }
  memoryOverrides = { status: {} };
  return memoryOverrides;
}

function writeOverrides(o: UserOverrides): void {
  memoryOverrides = o;
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(USER_OVERRIDE_KEY, JSON.stringify(o));
  } catch {
    // ignore
  }
}

function emailFor(name: string): string {
  const parts = name.toLowerCase().replace(/[^a-z ]/g, "").split(/\s+/);
  return `${parts[0] ?? "student"}.${parts[parts.length - 1] ?? "user"}@must.ac.tz`;
}

function allStudents(): Student[] {
  return [mockCurrentStudent, ...mockStudents];
}

async function allStudentsDb(): Promise<Student[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("profiles").select("*").order("created_at");
  if (error || !data) return [];
  return (data as DbProfile[]).map((r) => mapProfile(r));
}

/** Demo identity rows for the admin users table (mock mode only). */
function demoRows(): { inactive: Set<string>; admin: Set<string> } {
  return { inactive: new Set(["elias-mbise"]), admin: new Set(["david-kim"]) };
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const [projects, teams] = await Promise.all([listAllProjects(), listTeams()]);
  const overrides = readOverrides();
  const configured = isSupabaseConfigured();
  // Supabase mode: role/status come from profiles (authoritative).
  // Mock mode: fixtures + deterministic demo rows + local overrides.
  const source: Student[] = configured ? await allStudentsDb() : allStudents();
  const demo = demoRows();
  const teamsByMember = new Map<string, Team>();
  for (const t of teams) for (const m of t.members) {
    if (!teamsByMember.has(m.studentId)) teamsByMember.set(m.studentId, t);
  }
  const projectCountByCreator = new Map<string, number>();
  for (const p of projects) {
    projectCountByCreator.set(p.creatorId, (projectCountByCreator.get(p.creatorId) ?? 0) + 1);
  }

  return source.map((s) => {
    const extra = s as Student & { role?: string; isActive?: boolean; email?: string };
    // Supabase mode: profiles row is authoritative — local overrides never apply.
    if (configured) {
      return {
        id: s.id,
        name: s.fullName,
        email: extra.email || emailFor(s.fullName),
        program: s.program,
        year: s.year,
        role: ((extra.role as UserRole) ?? "student") as UserRole,
        accountStatus: (extra.isActive === false ? "inactive" : "active") as "active" | "inactive",
        profileCompletion: s.profileCompletion,
        teamName: teamsByMember.get(s.id)?.projectTitle ?? null,
        projectCount: projectCountByCreator.get(s.id) ?? 0,
        joinedAt: s.createdAt,
      };
    }
    return {
      id: s.id,
      name: s.fullName,
      email: emailFor(s.fullName),
      program: s.program,
      year: s.year,
      role: (demo.admin.has(s.id) ? "admin" : "student") as UserRole,
      accountStatus: (overrides.status[s.id] ?? (demo.inactive.has(s.id) ? "inactive" : "active")) as
        | "active"
        | "inactive",
      profileCompletion: s.profileCompletion,
      teamName: teamsByMember.get(s.id)?.projectTitle ?? null,
      projectCount: projectCountByCreator.get(s.id) ?? 0,
      joinedAt: s.createdAt,
    };
  });
}

export interface UserFilters {
  query: string;
  role: string;
  accountStatus: string;
  teamStatus: string;
  program: string;
}

/** Pure client-side filtering (mock mode) — unit-tested. */
export function filterAdminUsers(users: AdminUser[], f: UserFilters): AdminUser[] {
  const q = f.query.trim().toLowerCase();
  return users.filter((u) => {
    if (
      q &&
      !`${u.name} ${u.email} ${u.program}`.toLowerCase().includes(q)
    )
      return false;
    if (f.role && u.role !== f.role) return false;
    if (f.accountStatus && u.accountStatus !== f.accountStatus) return false;
    if (f.teamStatus === "in-team" && !u.teamName) return false;
    if (f.teamStatus === "no-team" && u.teamName) return false;
    if (f.program && u.program !== f.program) return false;
    return true;
  });
}

export type AdminError = "FORBIDDEN" | "NOT_FOUND";

function requireAdmin(role: UserRole): { ok: true } | { ok: false; error: AdminError } {
  return canAccessAdmin(role) ? { ok: true } : { ok: false, error: "FORBIDDEN" };
}

/**
 * Mock-mode gate. In Supabase mode the gate is SKIPPED here on purpose:
 * the caller's localStorage role is untrusted, so authorization happens
 * inside the Server Action (requireAdmin on the DB row) instead.
 */
function mockGate(actorRole: UserRole) {
  return requireAdmin(actorRole);
}

export async function adminSetUserStatus(
  id: string,
  status: AccountStatus,
  actorRole: UserRole
): Promise<{ ok: true } | { ok: false; error: AdminError }> {
  if (isSupabaseConfigured()) {
    const res = await adminSetUserStatusAction(id, status === "active");
    if (res.ok) return { ok: true };
    return { ok: false, error: res.code === "FORBIDDEN" || res.code === "UNAUTHENTICATED" ? "FORBIDDEN" : "NOT_FOUND" };
  }
  const gate = mockGate(actorRole);
  if (!gate.ok) return gate;
  const known = allStudents().some((s) => s.id === id);
  if (!known) return { ok: false, error: "NOT_FOUND" };
  const o = readOverrides();
  o.status[id] = status;
  writeOverrides(o);
  return { ok: true };
}

export async function adminSetProjectStatus(
  id: string,
  status: ProjectStatus,
  actorRole: UserRole
): Promise<{ ok: true } | { ok: false; error: AdminError }> {
  if (isSupabaseConfigured()) {
    const res = await setProjectStatusAction(id, toDbStatus(status), true);
    if (res.ok) return { ok: true };
    return { ok: false, error: res.code === "FORBIDDEN" || res.code === "UNAUTHENTICATED" ? "FORBIDDEN" : "NOT_FOUND" };
  }
  const gate = mockGate(actorRole);
  if (!gate.ok) return gate;
  const updated = await setProjectStatus(id, status);
  return updated ? { ok: true } : { ok: false, error: "NOT_FOUND" };
}

export async function adminArchiveProject(
  id: string,
  actorRole: UserRole
): Promise<{ ok: true } | { ok: false; error: AdminError }> {
  return adminSetProjectStatus(id, "Archived", actorRole);
}

export async function adminDeleteProject(
  id: string,
  actorRole: UserRole
): Promise<{ ok: true } | { ok: false; error: AdminError }> {
  if (isSupabaseConfigured()) {
    const res = await deleteProjectAction(id, true);
    if (res.ok) return { ok: true };
    return { ok: false, error: res.code === "FORBIDDEN" || res.code === "UNAUTHENTICATED" ? "FORBIDDEN" : "NOT_FOUND" };
  }
  const gate = mockGate(actorRole);
  if (!gate.ok) return gate;
  const deleted = await deleteProject(id);
  return deleted ? { ok: true } : { ok: false, error: "NOT_FOUND" };
}

export async function adminSetTeamStatus(
  teamId: string,
  status: ProjectStatus,
  actorRole: UserRole
): Promise<{ ok: true } | { ok: false; error: AdminError }> {
  const gate = requireAdmin(actorRole);
  if (!gate.ok) return gate;
  const res = await updateTeamStatus(teamId, status, "admin", { asAdmin: true });
  return res.ok ? { ok: true } : { ok: false, error: "NOT_FOUND" };
}

export async function adminDisbandTeam(
  teamId: string,
  actorRole: UserRole
): Promise<{ ok: true } | { ok: false; error: AdminError }> {
  const gate = requireAdmin(actorRole);
  if (!gate.ok) return gate;
  const res = await disbandTeam(teamId);
  return res.ok ? { ok: true } : { ok: false, error: "NOT_FOUND" };
}

/* --------------------------------- stats ---------------------------------- */

export interface AdminStats {
  totalStudents: number;
  activeStudents: number;
  totalProjects: number;
  activeProjects: number;
  totalTeams: number;
  completedTeams: number;
  pendingRequests: number;
  successfulMatches: number;
}

const isActiveProject = (p: Project) => p.status === "Recruiting" || p.status === "In Progress";

export async function getAdminStats(): Promise<AdminStats> {
  const [users, projects, teams, requests] = await Promise.all([
    getAdminUsers(),
    listAllProjects(),
    listTeams(),
    listAllRequests(),
  ]);
  return {
    totalStudents: users.length,
    activeStudents: users.filter((u) => u.accountStatus === "active" && u.profileCompletion >= 70).length,
    totalProjects: projects.filter((p) => p.status !== "Archived").length,
    activeProjects: projects.filter(isActiveProject).length,
    totalTeams: teams.length,
    completedTeams: teams.filter((t) => t.status === "Completed").length,
    pendingRequests: requests.filter((r) => r.status === "pending").length,
    successfulMatches: requests.filter((r) => r.status === "accepted").length,
  };
}

export interface StatusSlice {
  status: string;
  count: number;
}

function countBy<T>(items: T[], key: (t: T) => string): StatusSlice[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()].map(([status, count]) => ({ status, count }));
}

export async function getProjectStatusStats(): Promise<StatusSlice[]> {
  const projects = await listAllProjects();
  return countBy(projects, (p) => p.status);
}

export async function getTeamStatusStats(): Promise<StatusSlice[]> {
  const teams = await listTeams();
  return countBy(teams, (t) => t.status);
}

export async function getProgramStats(): Promise<StatusSlice[]> {
  const users = await getAdminUsers();
  const slices = countBy(users, (u) => u.program);
  return slices.sort((a, b) => b.count - a.count);
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export interface WeekdaySlice {
  day: string;
  count: number;
}

/** Matching/request activity per weekday (Mon–Sun), derived from request timestamps. */
export async function getWeekdayActivity(): Promise<WeekdaySlice[]> {
  const requests = await listAllRequests();
  const counts = new Array<number>(7).fill(0);
  for (const r of requests) {
    const jsDay = new Date(r.createdAt).getDay(); // 0=Sun
    counts[(jsDay + 6) % 7] += 1;
  }
  return WEEKDAYS.map((day, i) => ({ day, count: counts[i] ?? 0 }));
}

/* -------------------------------- reports --------------------------------- */

export interface ReportBundle {
  students: {
    total: number;
    active: number;
    inTeams: number;
    withoutTeams: number;
    incompleteProfiles: number;
    byProgram: StatusSlice[];
    byYear: StatusSlice[];
  };
  projects: {
    total: number;
    recruiting: number;
    active: number;
    completed: number;
    archived: number;
    withoutTeams: number;
  };
  teams: {
    total: number;
    recruiting: number;
    complete: number;
    active: number;
    completed: number;
    averageSize: number;
    withSkillGaps: number;
  };
  matching: {
    recommendations: number;
    invitationsSent: number;
    accepted: number;
    rejected: number;
    successRate: number;
    averageMatchScore: number;
    topRequestedSkills: StatusSlice[];
    topSkillGaps: StatusSlice[];
  };
}

export async function getReports(): Promise<ReportBundle> {
  const [users, projects, teams, requests, students] = await Promise.all([
    getAdminUsers(),
    listAllProjects(),
    listTeams(),
    listAllRequests(),
    listStudents(),
  ]);
  const liveProjects = projects.filter((p) => p.status !== "Archived");
  const teamProjectIds = new Set(teams.map((t) => t.projectId));
  const inTeamIds = new Set<string>();
  for (const t of teams) for (const m of t.members) inTeamIds.add(m.studentId);

  const invitations = requests.filter((r) => r.type === "invitation");
  const accepted = requests.filter((r) => r.status === "accepted").length;
  const rejected = requests.filter((r) => r.status === "rejected").length;
  const scored = requests.filter((r) => typeof r.match === "number");
  const averageMatchScore =
    scored.length > 0
      ? Math.round(scored.reduce((s, r) => s + (r.match ?? 0), 0) / scored.length)
      : 0;

  const skillCount = new Map<string, number>();
  for (const p of liveProjects)
    for (const s of p.requiredSkills) skillCount.set(s, (skillCount.get(s) ?? 0) + 1);
  const topRequestedSkills = [...skillCount.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const studentsById = new Map(students.map((s) => [s.id, s]));
  const gapCount = new Map<string, number>();
  const projectById = new Map(projects.map((p) => [p.id, p]));
  for (const t of teams) {
    const project = projectById.get(t.projectId);
    if (!project) continue;
    for (const g of getTeamSkillGaps(project, t, studentsById)) {
      if (g.status !== "covered")
        gapCount.set(g.skill, (gapCount.get(g.skill) ?? 0) + 1);
    }
  }
  const topSkillGaps = [...gapCount.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const sizes = teams.map((t) => t.members.length);
  const withGaps = new Set<string>();
  for (const t of teams) {
    const project = projectById.get(t.projectId);
    if (!project) continue;
    if (getTeamSkillGaps(project, t, studentsById).some((g) => g.status !== "covered"))
      withGaps.add(t.id);
  }

  return {
    students: {
      total: users.length,
      active: users.filter((u) => u.accountStatus === "active" && u.profileCompletion >= 70).length,
      inTeams: users.filter((u) => inTeamIds.has(u.id)).length,
      withoutTeams: users.filter((u) => !inTeamIds.has(u.id)).length,
      incompleteProfiles: users.filter((u) => u.profileCompletion < 100).length,
      byProgram: countBy(users, (u) => u.program).sort((a, b) => b.count - a.count),
      byYear: countBy(users, (u) => `Year ${u.year}`).sort((a, b) => a.status.localeCompare(b.status)),
    },
    projects: {
      total: liveProjects.length,
      recruiting: liveProjects.filter((p) => p.status === "Recruiting").length,
      active: liveProjects.filter(isActiveProject).length,
      completed: liveProjects.filter((p) => p.status === "Completed").length,
      archived: projects.filter((p) => p.status === "Archived").length,
      withoutTeams: liveProjects.filter((p) => !teamProjectIds.has(p.id)).length,
    },
    teams: {
      total: teams.length,
      recruiting: teams.filter((t) => t.status === "Recruiting").length,
      complete: teams.filter((t) => t.status === "Team Complete").length,
      active: teams.filter((t) => t.status === "Recruiting" || t.status === "In Progress").length,
      completed: teams.filter((t) => t.status === "Completed").length,
      averageSize:
        sizes.length > 0 ? Math.round((sizes.reduce((a, b) => a + b, 0) / sizes.length) * 10) / 10 : 0,
      withSkillGaps: withGaps.size,
    },
    matching: {
      recommendations: requests.length,
      invitationsSent: invitations.length,
      accepted,
      rejected,
      successRate: accepted + rejected > 0 ? Math.round((accepted / (accepted + rejected)) * 100) : 0,
      averageMatchScore,
      topRequestedSkills,
      topSkillGaps,
    },
  };
}

export interface AdminActivityItem {
  id: string;
  title: string;
  detail?: string;
  createdAt: string;
  linkHref?: string;
}

export async function getRecentActivity(limit = 10): Promise<AdminActivityItem[]> {
  const [teamActivity, requests, projects, students] = await Promise.all([
    listAllTeamActivity(),
    listAllRequests(),
    listAllProjects(),
    listStudents(),
  ]);
  const studentsById = new Map(students.map((s) => [s.id, s]));
  const projectById = new Map(projects.map((p) => [p.id, p]));
  const items: AdminActivityItem[] = [];

  for (const a of teamActivity.slice(0, 20)) {
    items.push({
      id: a.id,
      title: a.title,
      detail: a.detail,
      createdAt: a.createdAt,
      linkHref: `/teams/${a.teamId}`,
    });
  }
  for (const r of requests.slice(0, 20)) {
    const sender = studentsById.get(r.senderId)?.fullName ?? "A student";
    const project = projectById.get(r.projectId)?.title ?? "a project";
    items.push({
      id: `act-${r.id}`,
      title:
        r.type === "invitation"
          ? `${sender} invited a teammate to “${project}”`
          : `${sender} requested to join “${project}”`,
      detail: `Status: ${r.status}`,
      createdAt: r.createdAt,
      linkHref: "/requests",
    });
  }
  for (const p of projects.slice(0, 10)) {
    items.push({
      id: `act-proj-${p.id}`,
      title: `${p.creatorName} created “${p.title}”`,
      createdAt: p.createdAt,
      linkHref: `/projects/${p.id}`,
    });
  }
  for (const s of students.slice(0, 10)) {
    items.push({
      id: `act-user-${s.id}`,
      title: `${s.fullName} registered`,
      detail: s.program,
      createdAt: s.createdAt,
      linkHref: "/admin/users",
    });
  }
  return items
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

/* -------------------------------- settings --------------------------------- */

export interface AdminSettings {
  platformName: string;
  defaultTeamSize: number;
  minMatchThreshold: number;
  notificationsEnabled: boolean;
}

const DEFAULT_SETTINGS: AdminSettings = {
  platformName: "Project Matcher",
  defaultTeamSize: 5,
  minMatchThreshold: 40,
  notificationsEnabled: true,
};

export function getAdminSettings(): AdminSettings {
  if (!isBrowser()) return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AdminSettings>) };
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

/** DB-backed settings read (Supabase mode: platform_settings table). */
export async function getAdminSettingsAsync(): Promise<AdminSettings> {
  if (!isSupabaseConfigured()) return getAdminSettings();
  const supabase = createClient();
  const { data } = await supabase.from("platform_settings").select("key, value");
  const merged = { ...DEFAULT_SETTINGS };
  for (const row of ((data ?? []) as { key: string; value: { value?: unknown } }[])) {
    const v = row.value?.value;
    if (row.key === "platformName" && typeof v === "string") merged.platformName = v;
    if (row.key === "defaultTeamSize" && typeof v === "number") merged.defaultTeamSize = v;
    if (row.key === "minMatchThreshold" && typeof v === "number") merged.minMatchThreshold = v;
    if (row.key === "notificationsEnabled" && typeof v === "boolean") merged.notificationsEnabled = v;
  }
  return merged;
}

export function saveAdminSettings(next: AdminSettings): AdminSettings {
  const clean: AdminSettings = {
    platformName: next.platformName.trim() || DEFAULT_SETTINGS.platformName,
    defaultTeamSize: Math.min(8, Math.max(2, Math.round(next.defaultTeamSize) || 5)),
    minMatchThreshold: Math.min(90, Math.max(0, Math.round(next.minMatchThreshold))),
    notificationsEnabled: next.notificationsEnabled,
  };
  if (isBrowser()) {
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(clean));
    } catch {
      // ignore
    }
  }
  if (isSupabaseConfigured()) {
    // Persist server-side too (admin-only table); local copy stays as cache.
    void adminSaveSettingsAction({
      platformName: clean.platformName,
      defaultTeamSize: clean.defaultTeamSize,
      minMatchThreshold: clean.minMatchThreshold,
      notificationsEnabled: clean.notificationsEnabled,
    });
  }
  return clean;
}

/** Tier cutoffs surfaced read-only so admin sees the live matching model. */
export function getMatchingTierCutoffs(): { tier: string; min: number }[] {
  return [
    { tier: "Excellent", min: 90 },
    { tier: "Strong", min: 75 },
    { tier: "Good", min: 60 },
    { tier: "Moderate", min: 40 },
    { tier: "Low", min: 0 },
  ];
}

export function getMatchingWeights(): { dimension: string; weight: string }[] {
  return (Object.entries(MATCH_WEIGHTS) as [string, number][]).map(([dimension, w]) => ({
    dimension: dimension[0].toUpperCase() + dimension.slice(1),
    weight: `${Math.round(w * 100)}%`,
  }));
}
