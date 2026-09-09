import type { StudentProfile } from "@/types";
import { emptyProfileDraft, mockProfile } from "@/lib/mock/profile";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { mapProfile, type DbProfile } from "@/lib/supabase/mappers";
import { saveProfileAction } from "@/lib/actions/profile";

/**
 * Profile service — single swap point for persistence.
 *
 * Mock mode: local draft (localStorage) seeded from mock data.
 * Supabase mode: draft stays a harmless local scratchpad, but finish/save
 * persists to `profiles` via Server Action and loading reads the DB row.
 */

const DRAFT_KEY = "pm.profile.draft.v1";

export const SETUP_STEPS = [
  { id: "basic", label: "Basic", title: "Basic Information" },
  { id: "academic", label: "Academic", title: "Academic Information" },
  { id: "skills", label: "Skills", title: "Your Skills" },
  { id: "interests", label: "Interests", title: "Your Interests" },
  { id: "availability", label: "Availability", title: "Availability & Experience" },
  { id: "review", label: "Review", title: "Review Profile" },
] as const;

export type SetupStepId = (typeof SETUP_STEPS)[number]["id"];

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadDraft(): StudentProfile {
  if (!isBrowser()) return emptyProfileDraft();
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return emptyProfileDraft();
    return { ...emptyProfileDraft(), ...(JSON.parse(raw) as Partial<StudentProfile>) };
  } catch {
    return emptyProfileDraft();
  }
}

export function saveDraft(draft: StudentProfile): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ ...draft, updatedAt: new Date().toISOString() })
    );
  } catch {
    // Storage full / unavailable — draft simply stays in memory.
  }
}

export function clearDraft(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

/** Seed the wizard from the mock profile (demo "continue where you left off"). */
export function seedDraftFromMock(): StudentProfile {
  return { ...mockProfile, updatedAt: new Date().toISOString() };
}

/**
 * Load the persisted profile (Supabase mode) mapped onto the setup draft
 * shape. Returns null when there is nothing saved yet.
 */
export async function loadPersistedProfile(): Promise<StudentProfile | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error || !data) return null;
  const row = mapProfile(data as DbProfile);
  const base = emptyProfileDraft();
  return {
    ...base,
    id: row.id,
    fullName: row.fullName,
    bio: row.bio,
    program: row.program,
    year: row.year,
    skills: row.skills.map((s) => ({ skill: s, level: "Intermediate" as const })),
    interests: row.interests,
    availability: row.availability,
    experienceLevel: row.experienceLevel,
    profileCompletion: row.profileCompletion,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Persist the finished draft. Supabase mode writes through the Server
 * Action (whitelisted fields only); mock mode keeps localStorage behavior.
 */
export async function persistProfile(
  draft: StudentProfile
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) return { ok: true };
  const res = await saveProfileAction({
    fullName: draft.fullName,
    bio: draft.bio,
    university: draft.university,
    program: draft.program,
    year: draft.year,
    skills: draft.skills.map((s) => s.skill),
    interests: draft.interests,
    availability: draft.availability,
    experienceLevel: draft.experienceLevel,
  });
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

export type ProfileErrors = Partial<Record<string, string>>;

export function validateStep(step: SetupStepId, draft: StudentProfile): ProfileErrors {
  const errors: ProfileErrors = {};
  switch (step) {
    case "basic":
      if (!draft.fullName.trim()) errors.fullName = "Full name is required.";
      if (!draft.bio.trim()) errors.bio = "Tell teammates a little about yourself.";
      else if (draft.bio.trim().length > 500)
        errors.bio = "Bio must be 500 characters or fewer.";
      break;
    case "academic":
      if (!draft.university.trim()) errors.university = "University is required.";
      if (!draft.program.trim()) errors.program = "Program is required.";
      if (!draft.year || draft.year < 1 || draft.year > 5)
        errors.year = "Select your year of study.";
      break;
    case "skills":
      if (draft.skills.length === 0)
        errors.skills = "Select at least one skill — matching needs it.";
      break;
    case "interests":
      if (draft.interests.length === 0)
        errors.interests = "Select at least one interest.";
      break;
    case "availability":
      if (draft.availableDays.length === 0 && draft.dayTimes.length === 0)
        errors.availability = "Tell us when you can meet — pick days or times.";
      if (!draft.workStyle) errors.workStyle = "Select a preferred work style.";
      break;
    case "review":
      return validateComplete(draft);
  }
  return errors;
}

export function validateComplete(draft: StudentProfile): ProfileErrors {
  return {
    ...validateStep("basic", draft),
    ...validateStep("academic", draft),
    ...validateStep("skills", draft),
    ...validateStep("interests", draft),
    ...validateStep("availability", draft),
  };
}

/**
 * Weighted completion percentage shown as "Profile completion: X%".
 * Weights mirror what the future matching engine consumes.
 */
export function computeCompletion(draft: StudentProfile): number {
  let score = 0;
  if (draft.fullName.trim()) score += 10;
  if (draft.bio.trim()) score += 10;
  if (draft.university.trim() && draft.program.trim() && draft.year) score += 20;
  if (draft.skills.length > 0) score += 20;
  if (draft.skills.length >= 3) score += 5;
  if (draft.interests.length > 0) score += 10;
  if (draft.interests.length >= 2) score += 5;
  if (draft.availableDays.length > 0 || draft.dayTimes.length > 0) score += 10;
  if (draft.workStyle) score += 5;
  if (draft.previousExperience?.trim()) score += 5;
  return Math.min(100, score);
}
