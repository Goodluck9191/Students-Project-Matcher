import Link from "next/link";
import { ArrowLeft, CalendarDays, UsersRound } from "lucide-react";
import { Progress } from "@/components/ui/Progress";
import { TeamStatus } from "./TeamStatus";
import { formatDate } from "@/lib/utils";
import type { Team } from "@/types";

export function TeamHeader({
  team,
  category,
}: {
  team: Team;
  category: string;
}) {
  return (
    <div>
      <Link
        href="/teams"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to My Teams
      </Link>
      <div className="mt-3 flex flex-col gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            {category}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            {team.projectTitle}
          </h1>
          <div className="mt-2">
            <TeamStatus team={team} />
          </div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <UsersRound className="h-4 w-4" aria-hidden />
            {team.members.length} / {team.maxMembers} Members
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" aria-hidden />
            Deadline: {formatDate(team.deadline)}
          </span>
        </div>
        <div className="max-w-xl">
          <div className="mb-1 flex justify-between text-[13px]">
            <span className="font-medium text-slate-600">Project Progress</span>
            <span className="font-semibold text-slate-800">{team.progress}%</span>
          </div>
          <Progress value={team.progress} ariaLabel={`Project progress ${team.progress} percent`} />
        </div>
      </div>
    </div>
  );
}
