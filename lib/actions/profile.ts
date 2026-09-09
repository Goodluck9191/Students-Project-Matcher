"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { requireUser } from "@/lib/supabase/auth";
import { done, fail, notConfigured, type ActionResult } from "./shared";

const ALLOWED_LEVELS = ["Beginner", "Intermediate", "Advanced"];
const ALLOWED_WORK_STYLES = ["Online", "In Person", "Hybrid"];

export interface SkillLevelInput {
  skill: string;
  level: string;
}

export interface ProfileInput {
  fullName: string;
  bio: string;
  university: string;
  program: string;
  year: number;
  skills: string[];
  skillLevels: SkillLevelInput[];
  interests: string[];
  availability: string[];
  availableDays: string[];
  dayTimes: string[];
  workStyle?: string;
  experienceLevel: string;
  department: string;
  graduationYear: string;
  previousExperience: string;
  avatarUrl?: string;
}

/**
 * Create/update the caller's OWN profile (upsert by session id).
 * SECURITY: the payload below is an explicit whitelist — `role` and
 * `is_active` can never be written through this action, and RLS rejects
 * any row whose role/is_active differs from the stored values.
 */
export async function saveProfileAction(input: ProfileInput): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return notConfigured();
  const check = await requireUser();
  if (!check.ok) return fail(check.reason, "You must be signed in.");
  if (!input.fullName.trim()) return fail("VALIDATION", "Full name is required.");
  if (!input.program.trim()) return fail("VALIDATION", "Program is required.");
  if (input.skills.length === 0) return fail("VALIDATION", "Select at least one skill.");

  const supabase = await createClient();
  // Upsert (not update): the signup trigger normally creates the row, but if
  // it ever missed, a bare update would silently affect 0 rows and edits
  // would vanish on refresh. RLS: self-insert + self-update-with-role-guard.
  // Only http(s) avatar URLs are stored — blob: previews never leave the browser.
  const avatarUrl =
    input.avatarUrl &&
    (input.avatarUrl.startsWith("http://") || input.avatarUrl.startsWith("https://"))
      ? input.avatarUrl
      : undefined;
  const cleanLevels = (input.skillLevels ?? [])
    .filter(
      (s) =>
        typeof s.skill === "string" &&
        s.skill.length > 0 &&
        ALLOWED_LEVELS.includes(s.level)
    )
    .slice(0, 60)
    .map((s) => ({ skill: s.skill.slice(0, 60), level: s.level }));
  const { error } = await supabase.from("profiles").upsert(
    {
      id: check.profile.id, // server-derived session id — never client-provided
      full_name: input.fullName.trim().slice(0, 120),
      bio: input.bio.slice(0, 500),
      academic_program: input.program.trim().slice(0, 120),
      year: input.year,
      skills: input.skills.filter((s) => typeof s === "string").slice(0, 60),
      skill_levels: cleanLevels,
      interests: input.interests.filter((s) => typeof s === "string").slice(0, 30),
      availability: input.availability.filter((s) => typeof s === "string").slice(0, 20),
      available_days: input.availableDays.filter((s) => typeof s === "string").slice(0, 7),
      day_times: input.dayTimes.filter((s) => typeof s === "string").slice(0, 4),
      work_style: ALLOWED_WORK_STYLES.includes(input.workStyle ?? "")
        ? input.workStyle
        : null,
      experience_level: ALLOWED_LEVELS.includes(input.experienceLevel)
        ? input.experienceLevel
        : "Beginner",
      university: input.university.trim().slice(0, 160),
      department: input.department.trim().slice(0, 160),
      graduation_year: input.graduationYear.trim().slice(0, 9),
      previous_experience: input.previousExperience.slice(0, 2000),
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      profile_completed: true,
    },
    { onConflict: "id" }
  );
  if (error) return fail("DB_ERROR", "Couldn't save your profile. Please try again.");
  return done(undefined);
}
