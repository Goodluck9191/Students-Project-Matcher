import Link from "next/link";
import { ArrowRight, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types";

export function NotificationsPreview({
  notifications,
  unreadCount,
}: {
  notifications: AppNotification[];
  unreadCount: number;
}) {
  return (
    <section aria-labelledby="notif-preview" className="min-w-0">
      <div className="flex items-end justify-between gap-3">
        <h2 id="notif-preview" className="inline-flex items-center gap-2 text-lg font-bold text-slate-900">
          Notifications
          {unreadCount > 0 && (
            <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-bold text-white">
              {unreadCount} new
            </span>
          )}
        </h2>
        <Link
          href="/notifications"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
        >
          View All <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      <Card className="mt-4">
        <CardContent className="py-2">
          <ul className="divide-y divide-slate-100">
            {notifications.slice(0, 3).map((n) => (
              <li key={n.id}>
                <Link
                  href={n.linkHref ?? "/notifications"}
                  className="flex items-start gap-3 rounded-lg px-1 py-3 hover:bg-slate-50"
                >
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      n.isRead ? "bg-slate-200" : "bg-brand-500"
                    )}
                    aria-label={n.isRead ? "Read" : "Unread"}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">
                      {n.title}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {n.body}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-slate-400">
                    <Bell className="h-3 w-3" aria-hidden />
                    {timeAgo(n.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
