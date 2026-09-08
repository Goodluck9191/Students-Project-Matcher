import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

/** Unread pill — hidden at zero, capped at 9+. */
export function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      aria-label={`${count} unread notifications`}
      className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white"
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function NotificationBell({ unread }: { unread: number }) {
  return (
    <Link
      href="/notifications"
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
    >
      <Bell className="h-5 w-5" />
      {unread > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}

const ICONS: Record<string, string> = {
  team_invitation: "📨",
  invitation: "📨",
  invitation_accepted: "🎉",
  request_accepted: "🎉",
  invitation_rejected: "💬",
  request_rejected: "💬",
  team_member_joined: "👥",
  team_added: "👥",
  team_full: "✅",
  team_status_changed: "🔄",
  match: "✨",
  project: "📁",
  system: "🔔",
};

export function NotificationIcon({ type }: { type: string }) {
  return (
    <span aria-hidden className="text-lg leading-none">
      {ICONS[type] ?? "🔔"}
    </span>
  );
}

export function notificationIconLabel(type: string): string {
  return (
    {
      team_invitation: "Invitation",
      invitation: "Invitation",
      invitation_accepted: "Accepted",
      request_accepted: "Accepted",
      invitation_rejected: "Declined",
      request_rejected: "Declined",
      team_member_joined: "New member",
      team_added: "New member",
      team_full: "Team full",
      team_status_changed: "Status change",
      match: "New match",
      project: "Project",
      system: "System",
    }[type] ?? "Notification"
  );
}

export function UnreadDot({ read }: { read: boolean }) {
  return (
    <span
      aria-label={read ? "Read" : "Unread"}
      className={cn(
        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
        read ? "bg-slate-200" : "bg-brand-500"
      )}
    />
  );
}
