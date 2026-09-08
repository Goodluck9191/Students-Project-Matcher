import { Card, CardContent } from "@/components/ui/Card";

/**
 * Dependency-free responsive charts (pure divs/SVG-free bars).
 * Values come from adminService — never invented per-component.
 */

export function HBarChart({
  title,
  subtitle,
  data,
  barClassName = "bg-brand-500",
}: {
  title: string;
  subtitle?: string;
  data: { status: string; count: number }[];
  barClassName?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <Card className="h-full">
      <CardContent className="py-5">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p>}
        {data.length === 0 || total === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No data yet.</p>
        ) : (
          <ul
            className="mt-4 space-y-3"
            role="img"
            aria-label={`${title}: ${data.map((d) => `${d.status} ${d.count}`).join(", ")}`}
          >
            {data.map((d) => (
              <li key={d.status}>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span className="truncate font-medium text-slate-700">{d.status}</span>
                  <span className="ml-2 shrink-0 tabular-nums text-slate-500">{d.count}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${barClassName}`}
                    style={{ width: `${Math.round((d.count / max) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function WeekdayChart({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle?: string;
  data: { day: string; count: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <Card className="h-full">
      <CardContent className="py-5">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p>}
        <div
          className="mt-4 flex h-36 items-end gap-1.5 sm:gap-2.5"
          role="img"
          aria-label={`${title}: ${data.map((d) => `${d.day.slice(0, 3)} ${d.count}`).join(", ")}`}
        >
          {data.map((d) => (
            <div key={d.day} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <span className="text-xs font-semibold tabular-nums text-slate-600">{d.count}</span>
              <div className="flex h-24 w-full items-end rounded-lg bg-slate-100">
                <div
                  className="w-full rounded-lg bg-gradient-to-t from-brand-600 to-accent-500"
                  style={{ height: `${Math.max(d.count > 0 ? 8 : 0, Math.round((d.count / max) * 100))}%` }}
                />
              </div>
              <span className="truncate text-[11px] text-slate-500">{d.day.slice(0, 3)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
