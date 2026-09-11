"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { getRoleRedirect } from "@/lib/supabase/session";
import { getCurrentRole } from "@/lib/services/session";

/**
 * Keeps platform admins out of the student workspace. Mirrors the proxy
 * redirect for client-side navigation and covers mock mode (where roles
 * live in localStorage and the proxy cannot see them).
 */
export function StudentGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const { isSupabaseConfigured } = await import("@/lib/supabase/config");
      let role: "admin" | "student";
      if (isSupabaseConfigured()) {
        const { getMyRoleAction } = await import("@/lib/actions/auth");
        role = (await getMyRoleAction()) ?? "student";
      } else {
        role = getCurrentRole();
      }
      if (!cancelled && getRoleRedirect(pathname, role)) {
        router.replace("/admin");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  return <>{children}</>;
}
