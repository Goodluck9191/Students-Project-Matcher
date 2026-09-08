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

/** Demo admin identity shown in the admin header. */
export function getAdminProfile(): { name: string; email: string; initials: string } {
  return {
    name: "Neema Admin",
    email: "admin@projectmatcher.edu",
    initials: "NA",
  };
}
