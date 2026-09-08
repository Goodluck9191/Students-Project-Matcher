import Link from "next/link";
import { FolderKanban, Inbox, Sparkles, UsersRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

function StatCard({
  icon: Icon,
  value,
  label,
  hint,
  href,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  hint: string;
  href?: string;
  accent: string;
}) {
  const body = (
    <CardContent className="flex items-center gap-4 py-5">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-2xl font-bold leading-none text-slate-900">
          {value}
        </span>
        <span className="mt-1 block truncate text-sm font-medium text-slate-600">
          {label}
        </span>
        <span className="block truncate text-xs text-slate-400">{hint}</span>
      </span>
    </CardContent>
  );

  if (href) {
    return (
      <Link href={href} aria-label={`${label}: ${value}. ${hint}`}>
        <Card className="h-full transition-colors hover:border-brand-300">
          {body}
        </Card>
      </Link>
    );
  }
  return <Card className="h-full">{body}</Card>;
}

export function OverviewStats({
  stats,
}: {
  stats: { myProjects: number; recommended: number; matches: number; pending: number };
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" role="list" aria-label="Overview statistics">
      <StatCard
        icon={FolderKanban}
        value={stats.myProjects}
        label="My Projects"
        hint="Created or joined"
        href="/projects"
        accent="bg-brand-50 text-brand-600"
      />
      <StatCard
        icon={Sparkles}
        value={stats.recommended}
        label="Recommended"
        hint="Projects for you"
        href="/projects"
        accent="bg-cyan-50 text-cyan-700"
      />
      <StatCard
        icon={UsersRound}
        value={stats.matches}
        label="Potential Matches"
        hint="Teammates to meet"
        href="/matches"
        accent="bg-emerald-50 text-emerald-700"
      />
      <StatCard
        icon={Inbox}
        value={stats.pending}
        label="Pending Requests"
        hint="Need your response"
        href="/requests"
        accent="bg-amber-50 text-amber-700"
      />
    </div>
  );
}
