"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminAccessDenied, AdminLoadingState } from "@/components/admin/AdminStates";
import {
  canAccessAdmin,
  getCurrentRole,
  setCurrentRole,
  type UserRole,
} from "@/lib/services/session";

/**
 * Admin shell: role-gated sidebar + header.
 * Students hitting any /admin URL get Access Denied (the gate lives
 * here, not just in hidden nav — production adds server/RLS checks).
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = React.useState<UserRole | null>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- mount-only session read:
     the role lives in localStorage (unavailable during SSR), so it must be
     read into state once after hydration. */
  React.useEffect(() => {
    // Demo-only preview switch: /admin?preview=admin
    if (window.location.search.includes("preview=admin")) {
      setCurrentRole("admin");
    }
    setRole(getCurrentRole());
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (role === null) {
    return (
      <div className="min-h-screen bg-[#f6f8fb] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <AdminLoadingState />
        </div>
      </div>
    );
  }

  if (!canAccessAdmin(role)) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f6f8fb]">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white px-4">
          <Button variant="ghost" size="icon" aria-label="Menu" disabled className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-sm font-bold text-slate-900">Project Matcher · Admin</span>
        </div>
        <main className="flex-1">
          <AdminAccessDenied />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f6f8fb]">
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          title="Admin Console"
          subtitle="Monitor and manage the Project Matcher platform."
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
        <footer className="border-t border-slate-200/70 bg-white px-6 py-4">
          <p className="mx-auto max-w-7xl text-xs text-slate-400">
            Project Matcher · Admin demo — authorization enforced via Supabase RLS in production.
          </p>
        </footer>
      </div>
    </div>
  );
}
