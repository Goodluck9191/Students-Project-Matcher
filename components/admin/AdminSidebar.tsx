"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FolderKanban,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";

export const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/teams", label: "Teams", icon: UsersRound },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function NavList({ onNavigate, pathname }: { onNavigate?: () => void; pathname: string }) {
  return (
    <ul className="space-y-1">
      {ADMIN_NAV.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-50 text-brand-800 ring-1 ring-inset ring-brand-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-brand-600" : "text-slate-400")} />
              <span className="flex-1">{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminSidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  return (
    <>
      <aside aria-label="Admin" className="hidden w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-5">
          <Logo />
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700 ring-1 ring-inset ring-brand-200">
            ADMIN
          </span>
        </div>
        <nav className="slim-scroll flex-1 overflow-y-auto px-3 py-4">
          <NavList pathname={pathname} />
        </nav>
        <div className="border-t border-slate-100 p-4">
          <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Demo role gate — RLS later.
          </p>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <button aria-label="Close navigation" onClick={onClose} className="absolute inset-0 animate-fade-in bg-slate-950/45" />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] animate-slide-in flex-col bg-white shadow-[var(--shadow-pop)]">
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
              <span className="flex items-center gap-2">
                <Logo />
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700 ring-1 ring-inset ring-brand-200">
                  ADMIN
                </span>
              </span>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3" aria-label="Admin mobile">
              <NavList pathname={pathname} onNavigate={onClose} />
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
