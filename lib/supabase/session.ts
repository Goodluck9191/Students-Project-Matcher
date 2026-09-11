import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Session sync for `proxy.ts` (Next 16 convention).
 * Refreshes the Supabase auth cookies on every matched request so
 * Server Components, Server Actions, and Route Handlers see a live session.
 * No-op when Supabase is not configured (mock mode).
 *
 * Also redirects signed-out users away from protected app/admin routes to
 * /login. This is a UX convenience only — every sensitive operation is
 * still authorized inside Server Actions/services + RLS.
 */
const PUBLIC_PREFIXES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/privacy",
  "/terms",
  "/auth/",
];

export function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some((p) => p !== "/" && pathname.startsWith(p));
}

/**
 * Student-area routes: the personal workspace (dashboard, projects, teams,
 * matching, requests, notifications, own profile pages). Admins are
 * redirected to /admin from these — platform admins operate only in the
 * admin console, never as students.
 *
 * NOTE: /profile/[id] (any sub-path under /profile/ except /profile itself,
 * /profile/me and /profile/setup) is intentionally NOT listed: admins use
 * it read-only to inspect student accounts from the users table.
 */
const ADMIN_BLOCKED_EXACT = ["/profile", "/profile/me", "/profile/setup"];

const ADMIN_BLOCKED_PREFIXES = [
  "/dashboard",
  "/matches",
  "/notifications",
  "/projects",
  "/requests",
  "/teams",
];

export function isStudentAreaPath(pathname: string): boolean {
  if (ADMIN_BLOCKED_EXACT.includes(pathname)) return true;
  return ADMIN_BLOCKED_PREFIXES.some((p) => pathname.startsWith(p));
}

/**
 * Pure role-routing decision, shared by proxy.ts and the app-shell gate.
 * Returns the redirect target, or null when the role may stay.
 * Students hitting /admin keep the existing Access Denied page (handled
 * by the admin layout), so this only ever redirects admins.
 */
export function getRoleRedirect(
  pathname: string,
  role: "admin" | "student" | null
): "/admin" | null {
  if (role === "admin" && isStudentAreaPath(pathname)) return "/admin";
  return null;
}

export async function updateSession(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session (writes fresh cookies when expired).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  if (!user && !isPublicPath(pathname)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  // Role separation (Supabase mode only — mock mode has no server-visible
  // role). Admins are sent to the admin console from student routes.
  if (user && isStudentAreaPath(pathname)) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if ((data as { role: string | null } | null)?.role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return supabaseResponse;
}
