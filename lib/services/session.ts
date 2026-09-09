/**
 * Mock session + platform roles (Stage 10).
 *
 * Roles: "student" | "admin" — platform-level access only. Team/project
 * responsibilities (owner, Frontend Developer, …) are separate concepts
 * and never grant platform access.
 *
 * SECURITY NOTE: these frontend checks are demo-only conveniences.
 * Production authorization MUST be enforced server-side and through
 * Supabase RLS (profiles.role + policies); never trust the client.
 * That enforcement belongs to the final Supabase integration stage.
 *
 * Stage 11: when Supabase is configured, identity and role come from the
 * authenticated session + profiles row (see getSessionIdentity);
 * localStorage is NEVER authoritative for security state.
 */

export type UserRole = "student" | "admin";

const ROLE_KEY = "pm.session.role.v1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/** Module memory is canonical; localStorage mirrors it in browsers. */
let memoryRole: UserRole = "student";

export function getCurrentRole(): UserRole {
  if (isBrowser()) {
    try {
      const stored = window.localStorage.getItem(ROLE_KEY);
      if (stored === "admin" || stored === "student") {
        memoryRole = stored;
        return stored;
      }
    } catch {
      // ignore
    }
  }
  return memoryRole;
}

/** Demo-only role switch (used by the access-denied preview + tests). */
export function setCurrentRole(role: UserRole): void {
  memoryRole = role;
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(ROLE_KEY, role);
  } catch {
    // ignore
  }
}

export function canAccessAdmin(role: UserRole): boolean {
  return role === "admin";
}

export interface SessionIdentity {
  id: string;
  fullName: string;
  role: UserRole;
}

/**
 * Who is using the app right now?
 * - Mock mode: the demo student ("me").
 * - Supabase mode: the authenticated user + their profiles row.
 * User-scoped pages (requests, teams, chat, dashboard) must use this
 * instead of a hardcoded id.
 */
export async function getSessionIdentity(): Promise<SessionIdentity> {
  const { isSupabaseConfigured } = await import("@/lib/supabase/config");
  if (!isSupabaseConfigured()) {
    const { mockCurrentStudent } = await import("@/lib/mock/students");
    return { id: "me", fullName: mockCurrentStudent.fullName, role: getCurrentRole() };
  }
  const supabase = (await import("@/lib/supabase/client")).createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { id: "me", fullName: "Student", role: "student" };
  const { data } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();
  const row = data as { full_name: string | null; role: string | null } | null;
  return {
    id: user.id,
    fullName: row?.full_name ?? "Student",
    role: row?.role === "admin" ? "admin" : "student",
  };
}

/** Demo admin identity shown in the admin header. */
export function getAdminProfile(): { name: string; email: string; initials: string } {
  return {
    name: "Neema Admin",
    email: "admin@projectmatcher.edu",
    initials: "NA",
  };
}
