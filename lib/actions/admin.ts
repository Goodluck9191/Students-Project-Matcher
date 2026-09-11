"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/supabase/auth";
import { done, fail, notConfigured, type ActionResult } from "./shared";

/** All admin mutations verify the caller's DB role server-side.
 *
 * NOTE: there is intentionally NO role-changing action. The platform has
 * exactly one admin, enforced by migration 016 (unique index + guard
 * trigger). Roles are controlled by the database/security model only.
 */

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

export interface EmailChangeResult {
  confirmationRequired: boolean;
}

/**
 * Change the CALLER's own login email through Supabase Auth.
 * Server-derived identity only — there is no target-user parameter, so
 * this can never retarget another account. Never touches role/is_active.
 */
export async function updateOwnEmailAction(
  email: string
): Promise<ActionResult<EmailChangeResult>> {
  if (!isSupabaseConfigured()) return notConfigured();
  const check = await requireAdmin();
  if (!check.ok) return fail(check.reason, "Not authorized.");
  const next = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next))
    return fail("VALIDATION", "Enter a valid email address.");
  if (next === check.profile.email.trim().toLowerCase())
    return fail("VALIDATION", "This is already your login email.");

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email: next });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("in use") || msg.includes("duplicate"))
      return fail("CONFLICT", "This email is already registered to another account.");
    if (msg.includes("rate limit") || msg.includes("too many") || msg.includes("429"))
      return fail("RATE_LIMITED", "Too many attempts. Please wait a few minutes and try again.");
    if (msg.includes("invalid") || msg.includes("valid email"))
      return fail("VALIDATION", "Enter a valid email address.");
    return fail("DB_ERROR", "Couldn't update the email. Please try again.");
  }
  // Refresh the session user: if Auth applied the change immediately the
  // emails match; otherwise confirmation is pending on the new address.
  const { data: refreshed } = await supabase.auth.getUser();
  const liveEmail = refreshed.user?.email?.trim().toLowerCase() ?? "";
  const confirmationRequired = liveEmail !== next;
  // Keep the display email in sync with the requested address. The
  // platform role is never written here (and RLS would reject it anyway).
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ email: next })
    .eq("id", check.profile.id);
  if (profileError) return fail("DB_ERROR", "Email updated, but the profile display email could not be synced.");
  return done({ confirmationRequired });
}
