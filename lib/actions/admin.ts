"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/supabase/auth";
import { done, fail, notConfigured, type ActionResult } from "./shared";

/** All admin mutations verify the caller's DB role server-side. */

export async function adminSetUserStatusAction(
  userId: string,
  isActive: boolean
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return notConfigured();
  const check = await requireAdmin();
  if (!check.ok) return fail(check.reason, "Not authorized.");
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", userId);
  if (error) return fail("DB_ERROR", "Couldn't update the account.");
  return done(undefined);
}

export async function adminSetUserRoleAction(
  userId: string,
  role: "student" | "admin"
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return notConfigured();
  const check = await requireAdmin();
  if (!check.ok) return fail(check.reason, "Not authorized.");
  if (!["student", "admin"].includes(role)) return fail("VALIDATION", "Invalid role.");
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) return fail("DB_ERROR", "Couldn't update the role.");
  return done(undefined);
}

export async function adminSaveSettingsAction(
  settings: Record<string, string | number | boolean>
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return notConfigured();
  const check = await requireAdmin();
  if (!check.ok) return fail(check.reason, "Not authorized.");
  const supabase = await createClient();
  const rows = Object.entries(settings).map(([key, value]) => ({ key, value: { value } }));
  const { error } = await supabase.from("platform_settings").upsert(rows, { onConflict: "key" });
  if (error) return fail("DB_ERROR", "Couldn't save settings.");
  return done(undefined);
}
