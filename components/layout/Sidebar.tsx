"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { STUDENT_NAV } from "@/lib/navigation";
import {
  usePendingRequestsCount,
  useUnreadCount,
} from "@/components/notifications/useNotificationCounts";
import { Logo } from "./Logo";

function formatCount(n: number): string {
  return n > 9 ? "9+" : String(n);
}

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const unread = useUnreadCount();
  const pending = usePendingRequestsCount();

  function liveBadge(href: string, fallback?: number): number | undefined {
    if (href === "/notifications") return unread > 0 ? unread : undefined;
    if (href === "/requests") return pending > 0 ? pending : undefined;
    return fallback;
  }

  return (
    <aside
      className={cn(
        "hidden w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white lg:flex",
        className
      )}
      aria-label="Primary"
    >
      <div className="flex h-16 items-center border-b border-slate-100 px-5">
        <Logo />
      </div>
      <nav className="slim-scroll flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </p>
        <ul className="space-y-1">
          {STUDENT_NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            const badge = liveBadge(item.href, item.badge);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-50 text-brand-800 ring-1 ring-inset ring-brand-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      active ? "text-brand-600" : "text-slate-400 group-hover:text-slate-500"
                    )}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {typeof badge === "number" && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                        active ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {formatCount(badge)}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 rounded-2xl bg-gradient-to-br from-brand-600 to-accent-600 p-4 text-white">
          <p className="text-sm font-semibold">Complete your profile</p>
          <p className="mt-1 text-xs text-white/80">
            Finished profiles get 3× more teammate matches.
          </p>
          <Link
            href="/profile/setup"
            className="mt-3 inline-flex h-8 items-center rounded-lg bg-white px-3 text-[13px] font-semibold text-brand-700 transition-colors hover:bg-brand-50"
          >
            Finish setup
          </Link>
        </div>
      </nav>
      <div className="border-t border-slate-100 p-4">
        <p className="text-[11px] text-slate-400">
          Smart matching · not dating.
          <br />
          Built for universities.
        </p>
      </div>
    </aside>
  );
}
