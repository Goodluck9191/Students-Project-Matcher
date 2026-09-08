import { History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { timeAgo } from "@/lib/utils";
import type { TeamActivityItem } from "@/types";

export function TeamActivity({ items }: { items: TeamActivityItem[] }) {
  return (
    <Card>
      <CardContent className="py-5">
        <h3 className="font-semibold text-slate-900">Recent Activity</h3>
        {items.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No team activity yet — invites, joins, and status changes will appear here.
          </p>
        ) : (
          <ul className="mt-3 space-y-1 divide-y divide-slate-100">
            {items.slice(0, 8).map((a) => (
              <li key={a.id} className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <History className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{a.title}</p>
                  {a.detail && (
                    <p className="truncate text-xs text-slate-500">{a.detail}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-slate-400">{timeAgo(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
