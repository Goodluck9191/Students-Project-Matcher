import Link from "next/link";
import { Activity, ArrowRight, FolderKanban, Settings, Users, UsersRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { timeAgo } from "@/lib/utils";
import type { AdminActivityItem } from "@/lib/services/admin";

export function AdminRecentActivity({ items }: { items: AdminActivityItem[] }) {
  return (
    <Card className="h-full">
      <CardContent className="py-5">
        <h3 className="font-semibold text-slate-900">Recent Activity</h3>
        {items.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No recent activity.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {items.map((a) => (
              <li key={a.id}>
                <Link href={a.linkHref ?? "/admin"} className="flex items-start gap-3 rounded-lg px-1 py-2.5 hover:bg-slate-50">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Activity className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">{a.title}</span>
                    {a.detail && <span className="block truncate text-xs text-slate-500">{a.detail}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">{timeAgo(a.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

const QUICK_ACTIONS = [
  { href: "/admin/users", label: "Manage Students", hint: "Roles & accounts", Icon: Users },
  { href: "/admin/projects", label: "View Projects", hint: "Status & archive", Icon: FolderKanban },
  { href: "/admin/teams", label: "View Teams", hint: "Capacity & health", Icon: UsersRound },
  { href: "/admin/reports", label: "View Reports", hint: "Platform analytics", Icon: Settings },
];

export function AdminQuickActions() {
  return (
    <Card className="h-full">
      <CardContent className="py-5">
        <h3 className="font-semibold text-slate-900">Quick Actions</h3>
        <ul className="mt-3 space-y-2">
          {QUICK_ACTIONS.map((a) => (
            <li key={a.href}>
              <Link
                href={a.href}
                className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 transition-colors hover:border-brand-300 hover:bg-brand-50/50"
              >
                <a.Icon className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-slate-800">{a.label}</span>
                  <span className="block text-xs text-slate-500">{a.hint}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function AdminEmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <EmptyState
      title={title}
      description={description}
      actionLabel={actionLabel}
      actionHref={actionHref}
    />
  );
}
