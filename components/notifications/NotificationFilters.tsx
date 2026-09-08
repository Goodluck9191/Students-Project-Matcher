"use client";

import { cn } from "@/lib/utils";

export type NotificationFilter = "all" | "unread";

export function NotificationFilters({
  value,
  onChange,
  unreadCount,
}: {
  value: NotificationFilter;
  onChange: (next: NotificationFilter) => void;
  unreadCount: number;
}) {
  return (
    <div role="tablist" aria-label="Filter notifications" className="inline-flex rounded-xl border border-slate-300 bg-white p-1">
      {(
        [
          { value: "all", label: "All" },
          { value: "unread", label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
        ] as const
      ).map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            "h-8 rounded-lg px-4 text-[13px] font-medium transition-colors",
            value === t.value
              ? "bg-brand-600 text-white"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
