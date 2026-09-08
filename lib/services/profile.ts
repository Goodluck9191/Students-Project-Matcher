import type { StudentProfile } from "@/types";
import { emptyProfileDraft, mockProfile } from "@/lib/mock/profile";

/**
 * Profile service — single swap point for future Supabase persistence.
 *
 * Stage 3 behaviour: reads/writes a local draft (localStorage, guarded for
 * SSR) seeded from mock data. UI pages must import from here, never touch
 * storage directly.
 *
 * TODO (Supabase):
 * - `loadProfile(userId)` → `from("profiles").select("*").eq("id", userId).single()`
 * - `saveProfile(userId, draft)` → `from("profiles").upsert({ id: userId, ...draft })`
 * - Avatar upload → Supabase Storage bucket `avatars`, store public URL in
 *   `avatar_url`. The wizard's `previewAvatarUrl` stays client-side only.
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
