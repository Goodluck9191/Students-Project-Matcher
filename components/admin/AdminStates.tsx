import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";

export function AdminReportCard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string | number }[];
}) {
  return (
    <Card className="h-full">
      <CardContent className="py-5">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <dl className="mt-3 space-y-0 divide-y divide-slate-100">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-3 py-2">
              <dt className="truncate text-sm text-slate-500">{r.label}</dt>
              <dd className="shrink-0 text-sm font-bold tabular-nums text-slate-900">{r.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export function AdminLoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading admin data">
      <Skeleton className="h-8 w-56 max-w-full" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-3 py-5">
              <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-3 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {[0, 1].map((i) => (
        <Skeleton key={i} className={i === 0 ? "h-40 w-full" : "h-24 w-full"} />
      ))}
      {Array.from({ length: Math.max(0, rows - 2) }).map((_, i) => (
        <Skeleton key={`x-${i}`} className="h-24 w-full" />
      ))}
    </div>
  );
}

export function AdminAccessDenied() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <EmptyState
        title="Access Denied"
        description="You do not have permission to access the administrator dashboard."
        actionLabel="Back to Dashboard"
        actionHref="/dashboard"
      />
      <p className="mt-4 text-center text-xs text-slate-400">
        Demo only:{" "}
        <Link href="/admin?preview=admin" className="font-medium text-brand-700 hover:underline">
          Preview as admin
        </Link>
      </p>
    </div>
  );
}
