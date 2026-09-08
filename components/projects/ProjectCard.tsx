import Link from "next/link";
import { CalendarDays, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { getMatchTier, tierStyles } from "@/lib/matching/score";
import { formatDate } from "@/lib/utils";
import type { Project } from "@/types";

/**
 * Generic project card — created for the dashboard (Stage 4) and designed
 * to be reused by project discovery in Stage 5 without changes.
 */
export function ProjectCard({ project }: { project: Project }) {
  const score = project.matchPercentage ?? 0;
  const tier = tierStyles(getMatchTier(score));

  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col py-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-slate-900">
              <Link href={`/projects/${project.id}`} className="hover:text-brand-700 hover:underline">
                {project.title}
              </Link>
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              by {project.creatorName} · {project.category}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${tier.classes}`}
            title={tier.label}
          >
            {score}%
          </span>
        </div>

        <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-slate-600">
          {project.description}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.requiredSkills.slice(0, 4).map((s) => (
            <Badge key={s} variant="outline">
              {s}
            </Badge>
          ))}
        </div>

        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs">
            <span className="font-medium text-slate-600">Match</span>
            <span className="text-slate-500">{score}% · {tier.label}</span>
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
