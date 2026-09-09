"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { requireAdmin, requireUser } from "@/lib/supabase/auth";
import { done, fail, notConfigured, type ActionResult } from "./shared";

async function teamContext(teamId: string) {
  const supabase = await createClient();
  const { data: team } = await supabase
    .from("teams")
    .select("id, project_id, owner_id")
    .eq("id", teamId)
    .single();
  return { supabase, team: team as { id: string; project_id: string; owner_id: string } | null };
}

export async function updateMemberRoleAction(
  teamId: string,
  userId: string,
  projectRole: string
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return notConfigured();
  const check = await requireUser();
  if (!check.ok) return fail(check.reason, "You must be signed in.");
  const { supabase } = await teamContext(teamId);
  // RLS owner policy enforces; re-check here for a clean error.
  const { data: team } = await supabase.from("teams").select("owner_id").eq("id", teamId).single();
  if ((team as { owner_id: string } | null)?.owner_id !== check.profile.id)
    return fail("FORBIDDEN", "Only the team owner can assign roles.");
  const { error } = await supabase
    .from("team_members")
    .update({ project_role: projectRole.slice(0, 60) })
    .eq("team_id", teamId)
    .eq("user_id", userId);
  if (error) return fail("DB_ERROR", "Couldn't update the role.");
  return done(undefined);
}

export async function removeMemberAction(teamId: string, userId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return notConfigured();
  const check = await requireUser();
  if (!check.ok) return fail(check.reason, "You must be signed in.");
  const { supabase } = await teamContext(teamId);
  const { data: team } = await supabase.from("teams").select("owner_id").eq("id", teamId).single();
  if ((team as { owner_id: string } | null)?.owner_id !== check.profile.id)
    return fail("FORBIDDEN", "Only the team owner can remove members.");
  if (userId === check.profile.id)
    return fail("VALIDATION", "Transfer ownership before removing yourself.");
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", userId);
  if (error) return fail("DB_ERROR", "Couldn't remove the member.");
  return done(undefined);
}

export async function leaveTeamAction(teamId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return notConfigured();
  const check = await requireUser();
  if (!check.ok) return fail(check.reason, "You must be signed in.");
  const supabase = await createClient();
  const { data: team } = await supabase.from("teams").select("owner_id").eq("id", teamId).single();
  if ((team as { owner_id: string } | null)?.owner_id === check.profile.id)
    return fail("FORBIDDEN", "Transfer ownership before leaving.");
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", check.profile.id);
  if (error) return fail("DB_ERROR", "Couldn't leave the team.");
  return done(undefined);
}

export async function transferOwnershipAction(
  teamId: string,
  newOwnerId: string
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return notConfigured();
  const check = await requireUser();
  if (!check.ok) return fail(check.reason, "You must be signed in.");
  const supabase = await createClient();
  const { data: team } = await supabase.from("teams").select("owner_id").eq("id", teamId).single();
  if ((team as { owner_id: string } | null)?.owner_id !== check.profile.id)
    return fail("FORBIDDEN", "Only the current owner can transfer ownership.");
  const { data: member } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("team_id", teamId)
    .eq("user_id", newOwnerId)
    .single();
  if (!member) return fail("VALIDATION", "New owner must be a team member.");
  const { error } = await supabase.from("teams").update({ owner_id: newOwnerId }).eq("id", teamId);
  if (error) return fail("DB_ERROR", "Couldn't transfer ownership.");
  await supabase
    .from("team_members")
    .update({ team_role: "owner" })
    .eq("team_id", teamId)
    .eq("user_id", newOwnerId);
  await supabase
    .from("team_members")
    .update({ team_role: "member" })
    .eq("team_id", teamId)
    .eq("user_id", check.profile.id);
  return done(undefined);
}

export async function updateTeamStatusAction(
  teamId: string,
  status: string,
  asAdmin = false
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return notConfigured();
  const check = asAdmin ? await requireAdmin() : await requireUser();
  if (!check.ok) return fail(check.reason, "Not authorized.");
  if (!["recruiting", "team_complete", "in_progress", "completed"].includes(status))
    return fail("VALIDATION", "Invalid status.");
  const supabase = await createClient();
  const { error } = await supabase.from("teams").update({ status }).eq("id", teamId);
  if (error) return fail("DB_ERROR", "Couldn't update the status.");
  return done(undefined);
}

export async function disbandTeamAction(teamId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return notConfigured();
  const check = await requireAdmin();
  if (!check.ok) return fail(check.reason, "Not authorized.");
  const supabase = await createClient();
  const { error } = await supabase.from("teams").delete().eq("id", teamId);
  if (error) return fail("DB_ERROR", "Couldn't disband the team.");
  return done(undefined);
}
