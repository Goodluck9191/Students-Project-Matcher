"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NOT_CONFIGURED_ERROR, isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Auth server actions (Stage 11). Sessions live in httpOnly cookies synced
 * by proxy.ts — the browser never handles tokens directly.
 */

export type AuthActionResult = { ok: true } | { ok: false; error: string };

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already exists") || m.includes("user already"))
    return "An account with this email already exists. Try logging in instead.";
  if (m.includes("invalid login credentials") || m.includes("invalid credentials"))
    return "Invalid email or password. Please try again.";
  if (m.includes("password") && (m.includes("weak") || m.includes("short") || m.includes("6 characters")))
    return "Password is too weak — use at least 8 characters with mixed case and numbers.";
  if (m.includes("email") && m.includes("invalid")) return "Enter a valid email address.";
  if (m.includes("expired") || m.includes("invalid") && m.includes("token"))
    return "This reset link is invalid or has expired. Request a new one.";
  if (m.includes("network") || m.includes("fetch"))
    return "Network problem — check your connection and try again.";
  return "Something went wrong. Please try again.";
}

function validateEmailPassword(email: string, password: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return "Enter a valid email address.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}

export async function signUpAction(
  email: string,
  password: string,
  fullName: string
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED_ERROR };
  const invalid = validateEmailPassword(email, password);
  if (invalid) return { ok: false, error: invalid };
  if (!fullName.trim()) return { ok: false, error: "Full name is required." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: fullName.trim() } },
  });
  // Role always defaults to student (DB default + trigger); never from input.
  if (error) return { ok: false, error: friendly(error.message) };
  return { ok: true };
}

export async function signInAction(
  email: string,
  password: string
): Promise<AuthActionResult & { role?: "student" | "admin" }> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED_ERROR };
  const invalid = validateEmailPassword(email, password);
  if (invalid) return { ok: false, error: invalid };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) return { ok: false, error: friendly(error.message) };

  // Block deactivated accounts at the gate (RLS is the real enforcement).
  // Role comes from the DB row — never from client input.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("is_active, role")
      .eq("id", user.id)
      .single();
    const row = data as { is_active: boolean | null; role: string | null } | null;
    if (row && row.is_active === false) {
      await supabase.auth.signOut();
      return { ok: false, error: "This account has been deactivated. Contact your administrator." };
    }
    return { ok: true, role: row?.role === "admin" ? "admin" : "student" };
  }
  return { ok: true, role: "student" };
}

/** Server-derived role for post-login routing and admin gating. */
export async function getMyRoleAction(): Promise<"admin" | "student" | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return (data as { role: string | null } | null)?.role === "admin" ? "admin" : "student";
}

export async function signOutAction(): Promise<void> {
  if (!isSupabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function sendResetAction(email: string): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED_ERROR };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))
    return { ok: false, error: "Enter a valid email address." };
  const supabase = await createClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${site}/reset-password`,
  });
  if (error) return { ok: false, error: friendly(error.message) };
  return { ok: true };
}

export async function updatePasswordAction(password: string): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED_ERROR };
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: friendly(error.message) };
  return { ok: true };
}
