import type {
  Project,
  ProjectCategory,
  ProjectStatus,
  ProjectType,
} from "@/types";
import { mockProjects } from "@/lib/mock/projects";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import {
  mapProject,
  toDbStatus,
  type DbProject,
  type DbTeamMember,
} from "@/lib/supabase/mappers";
import {
  createProjectAction,
  deleteProjectAction,
  setProjectStatusAction,
  updateProjectAction,
} from "@/lib/actions/projects";

/**
 * Project service — single swap point for persistence.
 *
 * Mock mode: mock dataset + session projects (module memory + localStorage).
 * Supabase mode: reads via RLS (browser client); writes via Server Actions
 * (server-side authZ). UI pages import from here either way.
 */

export interface ProjectFilters {
  query: string;
  category: string;
  skills: string[];
  program: string;
  status: string;
  teamSize: string; // "" | "2-3" | "4-5" | "6+"
  deadline: string; // "" | "week" | "month" | "next-month" | "later"
  sort: "match" | "deadline" | "newest";
}

export const EMPTY_FILTERS: ProjectFilters = {
  query: "",
  category: "",
  skills: [],
  program: "",
  status: "",
  teamSize: "",
  deadline: "",
  sort: "match",
};

export interface ProjectFormValues {
  title: string;
  description: string;
  category: string;
  projectType: ProjectType;
  program: string;
  year: string;
  maxTeamSize: string;
  requiredSkills: string[];
  interests: string[];
  deadline: string; // yyyy-mm-dd
}

export const EMPTY_FORM: ProjectFormValues = {
  title: "",
  description: "",
  category: "",
  projectType: "Coursework",
  program: "",
  year: "",
  maxTeamSize: "5",
  requiredSkills: [],
  interests: [],
  deadline: "",
};

export type ProjectFormErrors = Partial<Record<keyof ProjectFormValues, string>>;

const mineKey = (id: string) => `pm.projects.created.${id}`;
const INDEX_KEY = "pm.projects.created.index.v1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStored(id: string): Project | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(mineKey(id));
    return raw ? (JSON.parse(raw) as Project) : null;
  } catch {
    return null;
  }
}

function readStoredIds(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(INDEX_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeStored(project: Project): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(mineKey(project.id), JSON.stringify(project));
    const ids = readStoredIds();
    if (!ids.includes(project.id)) {
      window.localStorage.setItem(INDEX_KEY, JSON.stringify([...ids, project.id]));
    }
  } catch {
    // Storage unavailable — project stays in module memory only.
  }
}

/** Session-created projects (module memory; hydrated from localStorage in browser). */
const sessionProjects: Project[] = [];

const ADMIN_OVERLAY_KEY = "pm.projects.admin.v1";

interface AdminOverlay {
  updates: Record<string, Partial<Project>>;
  deleted: string[];
}

/** Module memory is canonical (works in Node/tests); localStorage mirrors it in browsers. */
let memoryOverlay: AdminOverlay | null = null;

function readAdminOverlay(): AdminOverlay {
  if (memoryOverlay) return memoryOverlay;
  if (isBrowser()) {
    try {
      const raw = window.localStorage.getItem(ADMIN_OVERLAY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AdminOverlay;
        if (parsed && typeof parsed === "object") {
          memoryOverlay = { updates: parsed.updates ?? {}, deleted: parsed.deleted ?? [] };
          return memoryOverlay;
        }
      }
    } catch {
      // fall through
    }
  }
  memoryOverlay = { updates: {}, deleted: [] };
  return memoryOverlay;
}

function writeAdminOverlay(overlay: AdminOverlay): void {
  memoryOverlay = overlay;
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(ADMIN_OVERLAY_KEY, JSON.stringify(overlay));
  } catch {
    // ignore
  }
}

function allProjects(): Project[] {
  if (isBrowser()) {
    for (const id of readStoredIds()) {
      if (!sessionProjects.some((p) => p.id === id)) {
        const stored = readStored(id);
        if (stored) sessionProjects.push(stored);
      }
    }
  }
  const overlay = readAdminOverlay();
  const deleted = new Set(overlay.deleted);
  return [...sessionProjects, ...mockProjects]
    .filter((p) => !deleted.has(p.id))
    .map((p) => (overlay.updates[p.id] ? { ...p, ...overlay.updates[p.id] } : p));
}

export function getProject(id: string): Project | undefined {
  return allProjects().find((p) => p.id === id);
}

/** Supabase read path: projects + creator names + live member counts. */
async function listProjectsDb(): Promise<Project[]> {
  const supabase = createClient();
  const [{ data: rows }, { data: profiles }, { data: teams }, { data: members }] =
    await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name"),
      supabase.from("teams").select("id, project_id"),
      supabase.from("team_members").select("team_id"),
    ]);
  const names = new Map(
    ((profiles ?? []) as { id: string; full_name: string | null }[]).map((p) => [p.id, p.full_name ?? "Unknown"])
  );
  const teamByProject = new Map(
    ((teams ?? []) as { id: string; project_id: string }[]).map((t) => [t.id, t.project_id])
  );
  const counts = new Map<string, number>();
  for (const m of ((members ?? []) as Pick<DbTeamMember, "team_id">[])) {
    const pid = teamByProject.get(m.team_id);
    if (pid) counts.set(pid, (counts.get(pid) ?? 0) + 1);
  }
  return ((rows ?? []) as DbProject[]).map((r) =>
    mapProject(r, names.get(r.creator_id) ?? "Unknown", counts.get(r.id) ?? 0)
  );
}

export function isProjectOwner(project: Project, userId = "me"): boolean {
  return project.creatorId === userId;
}

function matchesDeadline(deadline: string, bucket: string): boolean {
  if (!bucket) return true;
  const days = (new Date(deadline).getTime() - Date.now()) / 86_400_000;
  switch (bucket) {
    case "week":
      return days <= 7;
    case "month":
      return days > 7 && days <= 31;
    case "next-month":
      return days > 31 && days <= 62;
    case "later":
      return days > 62;
    default:
      return true;
  }
}

function matchesTeamSize(max: number, bucket: string): boolean {
  switch (bucket) {
    case "2-3":
      return max >= 2 && max <= 3;
    case "4-5":
      return max >= 4 && max <= 5;
    case "6+":
      return max >= 6;
    default:
      return true;
  }
}

export function filterProjects(projects: Project[], f: ProjectFilters): Project[] {
  const q = f.query.trim().toLowerCase();
  const result = projects.filter((p) => {
    // Archived projects never surface in student discovery.
    if (!f.status && p.status === "Archived") return false;
    if (
      q &&
      !`${p.title} ${p.description} ${p.requiredSkills.join(" ")} ${p.category}`.toLowerCase().includes(q)
    )
      return false;
    if (f.category && p.category !== f.category) return false;
    if (f.skills.length > 0 && !f.skills.some((s) => p.requiredSkills.includes(s)))
      return false;
    if (f.program && p.program !== f.program) return false;
    if (f.status && p.status !== (f.status as ProjectStatus)) return false;
    if (!matchesTeamSize(p.maxTeamSize, f.teamSize)) return false;
    if (!matchesDeadline(p.deadline, f.deadline)) return false;
    return true;
  });

  return [...result].sort((a, b) => {
    switch (f.sort) {
      case "deadline":
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return (b.matchPercentage ?? 0) - (a.matchPercentage ?? 0);
    }
  });
}

export async function listProjects(filters: ProjectFilters): Promise<Project[]> {
  if (isSupabaseConfigured()) {
    return filterProjects(await listProjectsDb(), filters);
  }
  await new Promise((r) => setTimeout(r, 450));
  return filterProjects(allProjects(), filters);
}

/** Admin view: every project including archived/deleted-excluded session state. */
export async function listAllProjects(): Promise<Project[]> {
  if (isSupabaseConfigured()) {
    return listProjectsDb();
  }
  await new Promise((r) => setTimeout(r, 300));
  return [...allProjects()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getProjectById(id: string): Promise<Project | null> {
  if (isSupabaseConfigured()) {
    const all = await listProjectsDb();
    return all.find((p) => p.id === id) ?? null;
  }
  await new Promise((r) => setTimeout(r, 350));
  return getProject(id) ?? null;
}

export function validateProjectForm(values: ProjectFormValues): ProjectFormErrors {
  const errors: ProjectFormErrors = {};
  if (!values.title.trim()) errors.title = "Project title is required.";
  else if (values.title.trim().length < 8)
    errors.title = "Give a descriptive title (at least 8 characters).";
  if (!values.description.trim()) errors.description = "Description is required.";
  else if (values.description.trim().length < 40)
    errors.description = "Describe the project in at least 40 characters.";
  if (!values.category) errors.category = "Category is required.";
  if (!values.program) errors.program = "Program is required.";
  const size = Number(values.maxTeamSize);
  if (!values.maxTeamSize || Number.isNaN(size) || size < 2 || size > 8)
    errors.maxTeamSize = "Team size must be between 2 and 8.";
  if (values.requiredSkills.length === 0)
    errors.requiredSkills = "Select at least one required skill.";
  if (values.interests.length === 0)
    errors.interests = "Select at least one interest.";
  if (!values.deadline) errors.deadline = "Deadline is required.";
  else {
    const day = new Date(`${values.deadline}T23:59:59`);
    if (Number.isNaN(day.getTime())) errors.deadline = "Enter a valid date.";
    else if (day.getTime() < Date.now() - 86_400_000)
      errors.deadline = "Deadline can't be in the past.";
  }
  return errors;
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
  return `${base || "project"}-${Date.now().toString(36)}`;
}

export async function createProject(
  values: ProjectFormValues,
  author: { id: string; name: string }
): Promise<Project> {
  if (isSupabaseConfigured()) {
    // Author identity is re-derived server-side; `author` is a display hint.
    const res = await createProjectAction({
      title: values.title,
      description: values.description,
      category: values.category,
      maxTeamSize: Number(values.maxTeamSize),
      requiredSkills: values.requiredSkills,
      deadline: new Date(`${values.deadline}T23:59:59`).toISOString(),
    });
    if (!res.ok) throw new Error(res.error);
    const created = await getProjectById(res.data.id);
    if (!created) throw new Error("Project was created but couldn't be loaded.");
    return created;
  }
  await new Promise((r) => setTimeout(r, 700));
  const project: Project = {
    id: slugify(values.title),
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category as ProjectCategory,
    projectType: values.projectType,
    creatorId: author.id,
    creatorName: author.name,
    requiredSkills: values.requiredSkills,
    interests: values.interests,
    program: values.program,
    year: values.year ? Number(values.year) : undefined,
    maxTeamSize: Number(values.maxTeamSize),
    currentMembers: 1,
    status: "Recruiting",
    deadline: new Date(`${values.deadline}T23:59:59`).toISOString(),
    matchPercentage: 100,
    createdAt: new Date().toISOString(),
  };
  sessionProjects.unshift(project);
  writeStored(project);
  return project;
}

export async function updateProject(
  id: string,
  values: ProjectFormValues
): Promise<Project | null> {
  if (isSupabaseConfigured()) {
    const res = await updateProjectAction(id, {
      title: values.title,
      description: values.description,
      category: values.category,
      maxTeamSize: Number(values.maxTeamSize),
      requiredSkills: values.requiredSkills,
      deadline: new Date(`${values.deadline}T23:59:59`).toISOString(),
    });
    if (!res.ok) throw new Error(res.error);
    return getProjectById(id);
  }
  await new Promise((r) => setTimeout(r, 700));
  const existing = getProject(id);
  if (!existing) return null;
  const updated: Project = {
    ...existing,
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category as ProjectCategory,
    projectType: values.projectType,
    program: values.program,
    year: values.year ? Number(values.year) : undefined,
    maxTeamSize: Number(values.maxTeamSize),
    requiredSkills: values.requiredSkills,
    interests: values.interests,
    deadline: new Date(`${values.deadline}T23:59:59`).toISOString(),
  };
  const idx = sessionProjects.findIndex((p) => p.id === id);
  if (idx >= 0) sessionProjects[idx] = updated;
  else {
    sessionProjects.unshift(updated);
  }
  writeStored(updated);
  // Owner edits resurrect admin-archived/deleted projects.
  const overlay = readAdminOverlay();
  if (overlay.deleted.includes(id) || overlay.updates[id]) {
    overlay.deleted = overlay.deleted.filter((d) => d !== id);
    delete overlay.updates[id];
    writeAdminOverlay(overlay);
  }
  return updated;
}

/* ------------------------- admin operations ------------------------- */
/**
 * Admin-only mutations (role-checked by callers in adminService).
 * Applied as overlays/tombstones over the SAME store students read,
 * so admin actions stay consistent across the whole app.
 */

export async function setProjectStatus(
  id: string,
  status: ProjectStatus
): Promise<Project | null> {
  if (isSupabaseConfigured()) {
    const res = await setProjectStatusAction(id, toDbStatus(status));
    if (!res.ok) throw new Error(res.error);
    return getProjectById(id);
  }
  await new Promise((r) => setTimeout(r, 400));
  const existing = getProject(id);
  if (!existing) return null;
  const overlay = readAdminOverlay();
  overlay.updates[id] = { ...(overlay.updates[id] ?? {}), status };
  overlay.deleted = overlay.deleted.filter((d) => d !== id);
  writeAdminOverlay(overlay);
  const idx = sessionProjects.findIndex((p) => p.id === id);
  if (idx >= 0) sessionProjects[idx] = { ...sessionProjects[idx], status };
  return getProject(id) ?? null;
}

export async function deleteProject(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const res = await deleteProjectAction(id);
    if (!res.ok) throw new Error(res.error);
    return true;
  }
  await new Promise((r) => setTimeout(r, 400));
  if (!getProject(id)) return false;
  const overlay = readAdminOverlay();
  if (!overlay.deleted.includes(id)) overlay.deleted.push(id);
  delete overlay.updates[id];
  writeAdminOverlay(overlay);
  const idx = sessionProjects.findIndex((p) => p.id === id);
  if (idx >= 0) sessionProjects.splice(idx, 1);
  return true;
}

/** Prefill the shared form from an existing project (edit flow). */
export function toFormValues(project: Project): ProjectFormValues {
  return {
    title: project.title,
    description: project.description,
    category: project.category,
    projectType: project.projectType,
    program: project.program,
    year: project.year ? String(project.year) : "",
    maxTeamSize: String(project.maxTeamSize),
    requiredSkills: [...project.requiredSkills],
    interests: [...project.interests],
    deadline: new Date(project.deadline).toISOString().slice(0, 10),
  };
}
