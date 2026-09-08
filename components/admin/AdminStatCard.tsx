import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";

export function AdminStatCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  accent: string;
}) {
  const body = (
    <CardContent className="flex items-center gap-4 py-5">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-2xl font-bold leading-none tabular-nums text-slate-900">
          {value}
        </span>
        <span className="mt-1 block truncate text-sm font-medium text-slate-600">{label}</span>
        {hint && <span className="block truncate text-xs text-slate-400">{hint}</span>}
      </span>
    </CardContent>
  );

  if (href) {
    return (
      <Link href={href} aria-label={`${label}: ${value}`}>
        <Card className="h-full transition-colors hover:border-brand-300">{body}</Card>
      </Link>
    );
  }
  return <Card className="h-full">{body}</Card>;
}
