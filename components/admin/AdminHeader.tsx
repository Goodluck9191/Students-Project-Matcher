"use client";

import Link from "next/link";
import { ArrowLeft, Menu } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { NotificationBell } from "@/components/notifications/NotificationBadge";
import { useUnreadCount } from "@/components/notifications/useNotificationCounts";
import { getAdminProfile } from "@/lib/services/session";

export function AdminHeader({
  title,
  subtitle,
  onMenuClick,
  adminName,
  adminEmail,
}: {
  title: string;
  subtitle: string;
  onMenuClick: () => void;
  /** Real admin identity in Supabase mode; falls back to the mock fixture. */
  adminName?: string;
  adminEmail?: string;
}) {
  const unread = useUnreadCount();
  const fallback = getAdminProfile();
  const name = adminName || fallback.name;
  const email = adminEmail || fallback.email;

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-slate-200/80 bg-white/85 px-4 py-2.5 backdrop-blur sm:px-6">
      <Button variant="ghost" size="icon" onClick={onMenuClick} aria-label="Open navigation menu" className="lg:hidden">
        <Menu className="h-5 w-5" />
      </Button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-bold text-slate-900">{title}</h1>
        <p className="hidden truncate text-[13px] text-slate-500 sm:block">{subtitle}</p>
      </div>
      <Link
        href="/"
        className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 md:inline-flex"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to site
      </Link>
      <NotificationBell unread={unread} />
      <span className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-1 sm:pr-2" title={email}>
        <Avatar name={name} size="sm" />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-[13px] font-semibold text-slate-900">{name}</span>
          <span className="block text-[11px] text-slate-500">Administrator</span>
        </span>
      </span>
    </header>
  );
}
