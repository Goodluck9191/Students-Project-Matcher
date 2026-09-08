import Link from "next/link";
import { Activity, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { timeAgo } from "@/lib/utils";
import type { ActivityItem } from "@/types";

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <section aria-labelledby="recent-activity" className="min-w-0">
      <div className="flex items-end justify-between gap-3">
        <h2 id="recent-activity" className="text-lg font-bold text-slate-900">
          Recent Activity
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
            {items.map((a) => (
              <li key={a.id}>
                <Link
                  href={a.linkHref ?? "/notifications"}
                  className="flex items-start gap-3 rounded-lg px-1 py-3 hover:bg-slate-50"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Activity className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">
                      {a.title}
                    </span>
                    {a.detail && (
                      <span className="block truncate text-xs text-slate-500">
                        {a.detail}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {timeAgo(a.createdAt)}
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
