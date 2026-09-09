"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { requireUser } from "@/lib/supabase/auth";
import { done, fail, notConfigured, type ActionResult } from "./shared";

const ALLOWED_LEVELS = ["Beginner", "Intermediate", "Advanced"];

export interface ProfileInput {
  fullName: string;
  bio: string;
  university: string;
  program: string;
  year: number;
  skills: string[];
  interests: string[];
  availability: string[];
  experienceLevel: string;
}

/** Update the caller's OWN profile. role/is_active are never writable here. */
export async function saveProfileAction(input: ProfileInput): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return notConfigured();
  const check = await requireUser();
  if (!check.ok) return fail(check.reason, "You must be signed in.");
  if (!input.fullName.trim()) return fail("VALIDATION", "Full name is required.");
  if (!input.program.trim()) return fail("VALIDATION", "Program is required.");
  if (input.skills.length === 0) return fail("VALIDATION", "Select at least one skill.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName.trim(),
      bio: input.bio.slice(0, 500),
      academic_program: input.program.trim(),
      year: input.year,
      skills: input.skills,
      interests: input.interests,
      availability: input.availability,
      experience_level: ALLOWED_LEVELS.includes(input.experienceLevel)
        ? input.experienceLevel
        : "Beginner",
      profile_completed: true,
    })
    .eq("id", check.profile.id);
  if (error) return fail("DB_ERROR", "Couldn't save your profile. Please try again.");
  return done(undefined);
}
