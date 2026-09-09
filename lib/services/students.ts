import type { Student, StudentProfile } from "@/types";
import { emptyProfileDraft } from "@/lib/mock/profile";
import { mockCurrentStudent, mockStudents } from "@/lib/mock/students";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { mapProfile, mapProfileExtra, type DbProfile } from "@/lib/supabase/mappers";

/**
 * Student service — swap point for Supabase.
 * Supabase mode: `profiles` table via RLS (browser client, anon key).
 * Mock mode: local fixtures. UI code is identical either way.
 */

const FULL_PROFILE_COLUMNS =
  "id, full_name, email, avatar_url, academic_program, year, bio, experience_level, skills, skill_levels, interests, availability, role, is_active, profile_completed, created_at";
const BASE_PROFILE_COLUMNS =
  "id, full_name, email, avatar_url, academic_program, year, bio, experience_level, skills, interests, availability, role, is_active, profile_completed, created_at";

async function listStudentsDb(): Promise<Student[]> {
  const supabase = createClient();
  const attempt = async (columns: string) =>
    supabase
      .from("profiles")
      .select(columns)
      .eq("role", "student")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(100);
  // Full select first (skill levels feed matching); if newer columns are
  // missing (migrations 011+ not applied yet), retry the base set so real
  // profiles still load instead of an empty list.
  const full = await attempt(FULL_PROFILE_COLUMNS);
  let rows: DbProfile[] = [];
  if (!full.error) {
    rows = (full.data ?? []) as unknown as DbProfile[];
  } else if (/column/i.test(full.error.message)) {
    console.warn("[students] retrying without newer profile columns:", full.error.message);
    const base = await attempt(BASE_PROFILE_COLUMNS);
    if (!base.error) rows = ((base.data ?? []) as unknown as DbProfile[]);
  }
  return rows.map((r) => mapProfile(r));
}

export async function listStudents(): Promise<Student[]> {
  if (isSupabaseConfigured()) return listStudentsDb();
  await new Promise((r) => setTimeout(r, 300));
  return [...mockStudents];
}

export async function getStudentById(id: string): Promise<Student | null> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
    if (error || !data) return null;
    return mapProfile(data as DbProfile);
  }
  await new Promise((r) => setTimeout(r, 200));
  if (id === "me") return mockCurrentStudent;
  return mockStudents.find((s) => s.id === id) ?? null;
}

export type StudentProfileResult =
  | { status: "ok"; profile: StudentProfile }
  | { status: "not-found" }
  | { status: "unavailable" };

/**
 * Full public profile for /profile/[id]. Supabase mode reads the row by
 * real id (email never exposed to viewers); inactive rows are reported as
 * unavailable. Mock mode resolves fixtures (incl. "me").
 */
export async function getStudentProfileById(id: string): Promise<StudentProfileResult> {
  if (!isSupabaseConfigured()) {
    await new Promise((r) => setTimeout(r, 200));
    const found =
      id === "me"
        ? mockCurrentStudent
        : mockStudents.find((s) => s.id === id);
    if (!found) return { status: "not-found" };
    const base = emptyProfileDraft();
    return {
      status: "ok",
      profile: {
        ...base,
        id: found.id,
        fullName: found.fullName,
        avatarUrl: found.avatarUrl,
        bio: found.bio,
        program: found.program,
        year: found.year,
        skills: found.skills.map((s) => ({
          skill: s,
          level: (found.skillLevels?.find((l) => l.skill === s)?.level ?? "Intermediate") as "Beginner" | "Intermediate" | "Advanced",
        })),
        interests: [...found.interests],
        availability: [...found.availability],
        experienceLevel: found.experienceLevel,
        profileCompletion: found.profileCompletion,
      },
    };
  }
  const supabase = createClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error || !data) return { status: "not-found" };
  const row = data as DbProfile;
  if (row.is_active === false) return { status: "unavailable" };
  const mapped = mapProfile(row);
  const extra = mapProfileExtra(row);
  const base = emptyProfileDraft();
  return {
    status: "ok",
    profile: {
      ...base,
      id: mapped.id,
      fullName: mapped.fullName,
      avatarUrl: mapped.avatarUrl,
      bio: mapped.bio,
      university: extra.university,
      department: extra.department,
      graduationYear: extra.graduationYear,
      previousExperience: extra.previousExperience,
      availableDays: extra.availableDays as StudentProfile["availableDays"],
      dayTimes: extra.dayTimes as StudentProfile["dayTimes"],
      workStyle: (extra.workStyle as StudentProfile["workStyle"]) ?? base.workStyle,
      program: mapped.program,
      year: mapped.year,
      skills:
        extra.skillLevels.length > 0
          ? extra.skillLevels.filter((s) => mapped.skills.includes(s.skill))
          : mapped.skills.map((s) => ({ skill: s, level: "Intermediate" as const })),
      interests: mapped.interests,
      availability: mapped.availability,
      experienceLevel: mapped.experienceLevel,
      profileCompletion: mapped.profileCompletion,
    },
  };
}

export function getCurrentUserId(): string {
  // Mock-mode identity. Supabase mode resolves the id from the session
  // (see lib/supabase/auth.ts); callers prefer explicit ids there.
  return mockCurrentStudent.id;
}
