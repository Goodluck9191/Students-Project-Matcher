"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { requireUser } from "@/lib/supabase/auth";
import { done, fail, notConfigured, type ActionResult } from "./shared";

const RPC_ERRORS: Record<string, [string, string]> = {
  NOT_AUTHENTICATED: ["UNAUTHENTICATED", "You must be signed in."],
  REQUEST_NOT_FOUND: ["NOT_FOUND", "This request no longer exists."],
  NOT_PENDING: ["CONFLICT", "This request has already been handled."],
  NOT_RECIPIENT: ["FORBIDDEN", "Only the recipient can respond."],
  ALREADY_MEMBER: ["CONFLICT", "Already a member of this team."],
  TEAM_FULL: ["CONFLICT", "This team is already full."],
};

function mapRpc(message: string): { code: string; error: string } {
  for (const [key, [code, error]] of Object.entries(RPC_ERRORS)) {
    if (message.includes(key)) return { code, error };
  }
  return { code: "DB_ERROR", error: "Something went wrong. Please try again." };
}

export async function sendInvitationAction(args: {
  teamId: string;
  recipientId: string;
  message?: string;
}): Promise<ActionResult<{ id: string }>> {
  if (!isSupabaseConfigured()) return notConfigured();
  const check = await requireUser();
  if (!check.ok) return fail(check.reason, "You must be signed in.");
  if (args.recipientId === check.profile.id) return fail("VALIDATION", "You cannot invite yourself.");

  const supabase = await createClient();
  const { data: team } = await supabase
    .from("teams")
    .select("id, project_id, owner_id")
    .eq("id", args.teamId)
    .single();
  const t = team as { id: string; project_id: string; owner_id: string } | null;
  if (!t) return fail("NOT_FOUND", "This team no longer exists.");
  if (t.owner_id !== check.profile.id) return fail("FORBIDDEN", "Only the team owner can invite.");

  const { data: recipient } = await supabase
    .from("profiles")
    .select("id, is_active")
    .eq("id", args.recipientId)
    .single();
  const r = recipient as { id: string; is_active: boolean | null } | null;
  if (!r) return fail("NOT_FOUND", "This student could not be found.");
  if (r.is_active === false) return fail("VALIDATION", "This student's account is inactive.");

  const { data: members } = await supabase.from("team_members").select("user_id").eq("team_id", t.id);
  const memberIds = ((members ?? []) as { user_id: string }[]).map((m) => m.user_id);
  if (memberIds.includes(args.recipientId)) return fail("CONFLICT", "This student is already a member.");
  const { data: project } = await supabase
    .from("projects")
    .select("required_team_size")
    .eq("id", t.project_id)
    .single();
  const capacity = (project as { required_team_size: number } | null)?.required_team_size ?? 8;
  if (memberIds.length >= capacity) return fail("CONFLICT", "Your team is already full.");

  const { data, error } = await supabase
    .from("team_requests")
    .insert({
      project_id: t.project_id,
      team_id: t.id,
      sender_id: check.profile.id,
      recipient_id: args.recipientId,
      type: "invitation",
      status: "pending",
      message: args.message?.slice(0, 500) ?? null,
    })
    .select("id")
    .single();
  if (error) {
    if (error.message.includes("team_requests_one_pending_invitation") || error.code === "23505")
      return fail("CONFLICT", "An invitation is already pending for this student.");
    return fail("DB_ERROR", "Couldn't send the invitation.");
  }
  const id = (data as { id: string }).id;
  await supabase.rpc("notify_user", {
    p_user_id: args.recipientId,
    p_type: "team_invitation",
    p_title: "New team invitation",
    p_body: `${check.profile.fullName} invited you to join a project team.`,
    p_action_url: "/requests",
    p_related_id: id,
  });
  return done({ id });
}

export async function sendJoinRequestAction(
  projectId: string,
  message?: string
): Promise<ActionResult<{ id: string }>> {
  if (!isSupabaseConfigured()) return notConfigured();
  const check = await requireUser();
  if (!check.ok) return fail(check.reason, "You must be signed in.");

  const supabase = await createClient();
  // Ensure the workspace exists (projects predating teams have none).
  // The RPC creates it owned by the project creator — never the caller.
  const { data: teamId, error: ensureError } = await supabase.rpc(
    "ensure_project_team",
    { p_project_id: projectId }
  );
  if (ensureError || !teamId) {
    if (ensureError?.message.includes("PROJECT_NOT_FOUND"))
      return fail("NOT_FOUND", "This project no longer exists.");
    return fail("DB_ERROR", "Couldn't set up the team workspace.");
  }
  const { data: team } = await supabase
    .from("teams")
    .select("id, owner_id")
    .eq("id", teamId as string)
    .single();
  const t = team as { id: string; owner_id: string } | null;
  if (!t) return fail("NOT_FOUND", "This project no longer exists.");
  const { data, error } = await supabase
    .from("team_requests")
    .insert({
      project_id: projectId,
      team_id: t.id,
      sender_id: check.profile.id,
      recipient_id: t.owner_id,
      type: "join_request",
      status: "pending",
      message: message?.slice(0, 500) ?? null,
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return fail("CONFLICT", "You already have a pending request here.");
    return fail("DB_ERROR", "Couldn't send the request.");
  }
  const id = (data as { id: string }).id;
  await supabase.rpc("notify_user", {
    p_user_id: t.owner_id,
    p_type: "team_invitation",
    p_title: "New join request",
    p_body: `${check.profile.fullName} requested to join your project team.`,
    p_action_url: "/requests",
    p_related_id: id,
  });
  return done({ id });
}

export async function acceptRequestAction(requestId: string): Promise<ActionResult<{ teamId: string }>> {
  if (!isSupabaseConfigured()) return notConfigured();
  const check = await requireUser();
  if (!check.ok) return fail(check.reason, "You must be signed in.");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_team_request", { p_request_id: requestId });
  if (error) {
    const mapped = mapRpc(error.message);
    return fail(mapped.code, mapped.error);
  }
  return done({ teamId: data as string });
}

export async function rejectRequestAction(requestId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return notConfigured();
  const check = await requireUser();
  if (!check.ok) return fail(check.reason, "You must be signed in.");
  const supabase = await createClient();
  const { data: req } = await supabase.from("team_requests").select("id,sender_id,recipient_id,status").eq("id", requestId).single();
  const r = req as { id: string; sender_id: string; recipient_id: string; status: string } | null;
  if (!r) return fail("NOT_FOUND", "This request no longer exists.");
  if (r.status !== "pending") return fail("CONFLICT", "This request has already been handled.");
  if (r.recipient_id !== check.profile.id) return fail("FORBIDDEN", "Only the recipient can respond.");
  await supabase.from("team_requests").update({ status: "rejected", responded_at: new Date().toISOString() }).eq("id", requestId);
  await supabase.rpc("notify_user", {
    p_user_id: r.sender_id,
    p_type: "invitation_rejected",
    p_title: "Invitation declined",
    p_body: `${check.profile.fullName} declined your invitation.`,
    p_action_url: "/requests",
    p_related_id: requestId,
  });
  return done(undefined);
}

export async function cancelRequestAction(requestId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return notConfigured();
  const check = await requireUser();
  if (!check.ok) return fail(check.reason, "You must be signed in.");
  const supabase = await createClient();
  const { data: req } = await supabase.from("team_requests").select("id,sender_id,status").eq("id", requestId).single();
  const r = req as { id: string; sender_id: string; status: string } | null;
  if (!r) return fail("NOT_FOUND", "This request no longer exists.");
  if (r.status !== "pending") return fail("CONFLICT", "This request has already been handled.");
  if (r.sender_id !== check.profile.id) return fail("FORBIDDEN", "Only the sender can cancel.");
  await supabase.from("team_requests").update({ status: "cancelled", responded_at: new Date().toISOString() }).eq("id", requestId);
  return done(undefined);
}
