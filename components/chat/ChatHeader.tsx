import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TeamStatus } from "@/components/teams/TeamStatus";
import type { Team } from "@/types";

export function ChatHeader({ team }: { team: Team }) {
  return (
    <div className="border-b border-slate-200/80 bg-white px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/teams/${team.id}`}
          aria-label="Back to team"
          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-sm font-bold text-white" aria-hidden>
          {team.projectTitle.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-bold text-slate-900">
            {team.projectTitle}
          </h1>
          <p className="truncate text-xs text-slate-500">
            Team Chat · {team.members.length} member{team.members.length === 1 ? "" : "s"} · {team.status}
          </p>
        </div>
        <div className="hidden shrink-0 sm:block">
          <TeamStatus team={team} />
        </div>
      </div>
      <div className="mt-2 flex gap-4 text-[13px] font-medium sm:hidden">
        <Link href={`/teams/${team.id}`} className="text-brand-700 hover:underline">
          Back to Team
        </Link>
        <Link href={`/projects/${team.projectId}`} className="text-brand-700 hover:underline">
          View Project
        </Link>
      </div>
    </div>
  );
}
