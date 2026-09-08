import Link from "next/link";
import { CalendarDays, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { getMatchTier, tierStyles } from "@/lib/matching/score";
import { formatDate } from "@/lib/utils";
import type { Project, ProjectStatus } from "@/types";

export const PROJECT_STATUS_BADGE: Record<ProjectStatus, "warning" | "success" | "info" | "default"> = {
  Recruiting: "warning",
  "Team Complete": "success",
  "In Progress": "info",
  "Completed": "default",
};

/**
 * Generic project card — shared by the dashboard (Stage 4) and project
 * discovery (Stage 5). Match % is mock data; real scoring lands in Stage 6.
 */
export function ProjectCard({ project }: { project: Project }) {
  const score = project.matchPercentage ?? 0;
  const tier = tierStyles(getMatchTier(score));

  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col py-5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-semibold uppercase tracking-wide text-brand-600">
            {project.category}
          </span>
          <Badge variant={PROJECT_STATUS_BADGE[project.status]} className="shrink-0">
            {project.status}
          </Badge>
        </div>

        <h3 className="mt-1.5 truncate font-semibold text-slate-900">
          <Link href={`/projects/${project.id}`} className="hover:text-brand-700 hover:underline">
            {project.title}
          </Link>
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">by {project.creatorName}</p>

        <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-slate-600">
          {project.description}
        </p>

        <div className="mt-3">
          <p className="text-xs font-medium text-slate-500">Required Skills</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {project.requiredSkills.slice(0, 4).map((s) => (
              <Badge key={s} variant="outline">
                {s}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs">
            <span className="font-medium text-slate-600">Match</span>
            <span className="font-bold text-slate-800">
              {score}% · {tier.label}
            </span>
          </div>
          <Progress value={score} ariaLabel={`Match score ${score} percent`} />
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <UsersRound className="h-3.5 w-3.5" aria-hidden />
            Team: {project.currentMembers}/{project.maxTeamSize}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            {formatDate(project.deadline)}
          </span>
        </div>

        <div className="mt-4 flex-1" />
        <Button href={`/projects/${project.id}`} variant="outline" size="sm" className="w-full">
          View Project
        </Button>
      </CardContent>
    </Card>
  );
}
