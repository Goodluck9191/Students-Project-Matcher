"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Server-side session + authorization (Stage 11).
 *
 * Source of truth is ALWAYS the Supabase session + profiles row.
 * Never localStorage, URL params, or client-provided roles.
 */

export interface SessionProfile {
  id: string;
  fullName: string;
  email: string;
  role: "student" | "admin";
  isActive: boolean;
  program: string;
  year: number;
}

export async function getCurrentUser(): Promise<{ id: string; email?: string } | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { id: user.id, email: user.email ?? undefined } : null;
}

export async function getCurrentProfile(): Promise<SessionProfile | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_active, academic_program, year")
    .eq("id", user.id)
    .single();
  if (error || !data) return null;
  const row = data as {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string | null;
    is_active: boolean | null;
    academic_program: string | null;
    year: number | null;
  };
  return {
    id: row.id,
    fullName: row.full_name ?? "",
    email: row.email ?? user.email ?? "",
    role: row.role === "admin" ? "admin" : "student",
    isActive: row.is_active ?? true,
    program: row.academic_program ?? "",
    year: row.year ?? 1,
  };
}

export type AuthCheck =
  | { ok: true; profile: SessionProfile }
  | { ok: false; reason: "UNAUTHENTICATED" | "INACTIVE" | "FORBIDDEN" | "NOT_CONFIGURED" };

/** Any signed-in, active user. */
export async function requireUser(): Promise<AuthCheck> {
  if (!isSupabaseConfigured()) return { ok: false, reason: "NOT_CONFIGURED" };
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, reason: "UNAUTHENTICATED" };
  if (!profile.isActive) return { ok: false, reason: "INACTIVE" };
  return { ok: true, profile };
}

/** Signed-in admin with an active account. Role comes from the DB row. */
export async function requireAdmin(): Promise<AuthCheck> {
  const check = await requireUser();
  if (!check.ok) return check;
  if (check.profile.role !== "admin") return { ok: false, reason: "FORBIDDEN" };
  return check;
}
