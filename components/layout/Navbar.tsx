"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { NotificationBell } from "@/components/notifications/NotificationBadge";
import { useUnreadCount } from "@/components/notifications/useNotificationCounts";
import { mockCurrentStudent } from "@/lib/mock/students";

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const [profileOpen, setProfileOpen] = React.useState(false);
  const unread = useUnreadCount();
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        className="lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="hidden min-w-0 flex-1 items-center md:flex">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search projects, skills, students…"
            aria-label="Search"
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 [&::-webkit-search-cancel-button]:hidden"
          />
        </div>
      </div>
      <div className="flex-1 md:hidden" />

      <NotificationBell unread={unread} />

      <div ref={menuRef} className="relative">
        <button
          onClick={() => setProfileOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={profileOpen}
          className="flex items-center gap-2.5 rounded-xl p-1.5 pr-2 transition-colors hover:bg-slate-100"
        >
          <Avatar name={mockCurrentStudent.fullName} size="sm" />
          <span className="hidden text-left leading-tight sm:block">
            <span className="block max-w-[120px] truncate text-[13px] font-semibold text-slate-900">
              {mockCurrentStudent.fullName}
            </span>
            <span className="block text-[11px] text-slate-500">
              {mockCurrentStudent.program} · Y{mockCurrentStudent.year}
            </span>
          </span>
        </button>
        {profileOpen && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-52 animate-fade-in overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-[var(--shadow-pop)]"
          >
            {[
              { href: "/profile/me", label: "View profile" },
              { href: "/profile/setup", label: "Edit profile" },
              { href: "/settings", label: "Settings" },
              { href: "/admin", label: "Admin dashboard" },
            ].map((l) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                role="menuitem"
                onClick={() => setProfileOpen(false)}
                className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                {l.label}
              </Link>
            ))}
            <div className="my-1.5 border-t border-slate-100" />
            <Link
              href="/login"
              role="menuitem"
              className="block px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
            >
              Sign out
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
