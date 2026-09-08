import { CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { PROJECT_STATUS_BADGE } from "@/components/projects/ProjectCard";
import { Badge } from "@/components/ui/Badge";
import { formatDate, daysUntil, timeAgo } from "@/lib/utils";
import type { Team } from "@/types";

export function TeamProgress({ team }: { team: Team }) {
  const daysLeft = daysUntil(team.deadline);
  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-slate-900">Project Progress</h3>
          <Badge variant={PROJECT_STATUS_BADGE[team.status]}>{team.status}</Badge>
        </div>
        <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{team.progress}%</p>
        <div className="mt-2">
          <Progress value={team.progress} ariaLabel={`Project progress ${team.progress} percent`} />
        </div>
        <dl className="mt-3 space-y-1.5 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Deadline</dt>
            <dd className="font-medium text-slate-800">{formatDate(team.deadline)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Remaining</dt>
            <dd className="font-medium text-slate-800">
              {daysLeft < 0 ? "Overdue" : daysLeft === 0 ? "Due today" : `${daysLeft} days remaining`}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Last update</dt>
            <dd className="inline-flex items-center gap-1 font-medium text-slate-800">
              <CalendarDays className="h-3.5 w-3.5 text-slate-400" aria-hidden />
              {timeAgo(team.updatedAt)}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
