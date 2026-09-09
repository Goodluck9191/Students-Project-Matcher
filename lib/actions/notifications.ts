"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { requireUser } from "@/lib/supabase/auth";
import { done, fail, notConfigured, type ActionResult } from "./shared";

export async function markNotificationReadAction(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return notConfigured();
  const check = await requireUser();
  if (!check.ok) return fail(check.reason, "You must be signed in.");
  const supabase = await createClient();
  // RLS scopes to own rows; the eq double-guards.
  await supabase.from("notifications").update({ read: true }).eq("id", id).eq("user_id", check.profile.id);
  return done(undefined);
}

export async function markAllNotificationsReadAction(): Promise<ActionResult<{ count: number }>> {
  if (!isSupabaseConfigured()) return notConfigured();
  const check = await requireUser();
  if (!check.ok) return fail(check.reason, "You must be signed in.");
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", check.profile.id)
    .eq("read", false)
    .select("id");
  return done({ count: Array.isArray(data) ? data.length : 0 });
}
