"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { requireAdmin, requireUser } from "@/lib/supabase/auth";
import { done, fail, notConfigured, type ActionResult } from "./shared";

export interface ProjectInput {
  title: string;
  description: string;
  category: string;
  maxTeamSize: number;
  requiredSkills: string[];
  deadline: string; // ISO
}

function validate(input: ProjectInput): string | null {
  if (input.title.trim().length < 8) return "Give a descriptive title (at least 8 characters).";
  if (input.description.trim().length < 40) return "Describe the project in at least 40 characters.";
  if (!input.category) return "Category is required.";
  if (!(input.maxTeamSize >= 2 && input.maxTeamSize <= 8)) return "Team size must be between 2 and 8.";
  if (input.requiredSkills.length === 0) return "Select at least one required skill.";
  if (Number.isNaN(new Date(input.deadline).getTime())) return "Enter a valid deadline.";
  return null;
}

export async function createProjectAction(input: ProjectInput): Promise<ActionResult<{ id: string }>> {
  if (!isSupabaseConfigured()) return notConfigured();
  const check = await requireUser();
  if (!check.ok) return fail(check.reason, "You must be signed in.");
  const invalid = validate(input);
  if (invalid) return fail("VALIDATION", invalid);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      creator_id: check.profile.id, // server-derived, never client-provided
      name: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      required_team_size: input.maxTeamSize,
      required_skills: input.requiredSkills,
      deadline: input.deadline,
      status: "recruiting",
    })
    .select("id")
    .single();
  if (error || !data) return fail("DB_ERROR", "Couldn't create the project. Please try again.");
  return done({ id: (data as { id: string }).id });
}

export async function updateProjectAction(
  id: string,
  input: ProjectInput
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return notConfigured();
  const check = await requireUser();
  if (!check.ok) return fail(check.reason, "You must be signed in.");
  const invalid = validate(input);
  if (invalid) return fail("VALIDATION", invalid);

  const supabase = await createClient();
  // RLS: only the creator's row is updatable (admins bypass via policy).
  const { error } = await supabase
    .from("projects")
    .update({
      name: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      required_team_size: input.maxTeamSize,
      required_skills: input.requiredSkills,
      deadline: input.deadline,
    })
    .eq("id", id);
  if (error) return fail("DB_ERROR", "Couldn't save changes. Check you own this project.");
  return done(undefined);
}

export async function setProjectStatusAction(
  id: string,
  status: string,
  asAdmin = false
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return notConfigured();
  const check = asAdmin ? await requireAdmin() : await requireUser();
  if (!check.ok) return fail(check.reason, "Not authorized.");
  if (!["draft", "recruiting", "in_progress", "completed", "archived"].includes(status))
    return fail("VALIDATION", "Invalid status.");

  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ status }).eq("id", id);
  if (error) return fail("DB_ERROR", "Couldn't update the status.");
  return done(undefined);
}

export async function deleteProjectAction(id: string, asAdmin = false): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return notConfigured();
  const check = asAdmin ? await requireAdmin() : await requireUser();
  if (!check.ok) return fail(check.reason, "Not authorized.");
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return fail("DB_ERROR", "Couldn't delete the project.");
  return done(undefined);
}
