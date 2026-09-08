"use client";

import Link from "next/link";
import { timeAgo } from "@/lib/utils";
import { markAsRead } from "@/lib/services/notifications";
import { NotificationIcon, UnreadDot, notificationIconLabel } from "./NotificationBadge";
import type { AppNotification } from "@/types";
import { cn } from "@/lib/utils";

/** A notification row — clicking marks it read, then follows its action URL. */
export function NotificationItem({
  notification,
  onRead,
}: {
  notification: AppNotification;
  onRead: (id: string) => void;
}) {
  const href = notification.linkHref ?? "/notifications";

  async function handleClick() {
    if (!notification.isRead) {
      await markAsRead(notification.id, notification.userId);
      onRead(notification.id);
    }
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 rounded-xl px-3 py-3.5 transition-colors hover:bg-slate-50",
        !notification.isRead && "bg-brand-50/50"
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200">
        <NotificationIcon type={notification.type} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "truncate text-sm",
              notification.isRead ? "font-medium text-slate-700" : "font-bold text-slate-900"
            )}
          >
            {notification.title}
          </span>
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            {notificationIconLabel(notification.type)}
          </span>
        </span>
        <span className="mt-0.5 block text-sm leading-relaxed text-slate-500">
          {notification.body}
        </span>
        <span className="mt-1 block text-xs text-slate-400">
          {timeAgo(notification.createdAt)}
        </span>
      </span>
      <UnreadDot read={notification.isRead} />
    </Link>
  );
}
