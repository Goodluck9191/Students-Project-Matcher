"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, GraduationCap } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import {
  PROJECT_STATUS_BADGE,
  ProjectActions,
  TeamCapacity,
} from "@/components/projects";
import { getProjectById } from "@/lib/services/projects";
import { getTeamForProject } from "@/lib/services/teams";
import { getMatchTier, tierStyles } from "@/lib/matching/score";
import { formatDate } from "@/lib/utils";
import type { Project, Team } from "@/types";

function TeamPreview({ project, team }: { project: Project; team: Team | null }) {
  const members = team?.members ?? [
    {
      studentId: project.creatorId,
      name: project.creatorName,
      role: "Project Creator",
      skills: project.requiredSkills.slice(0, 2),
      matchScore: project.matchPercentage ?? 80,
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[15px] font-semibold text-slate-900">Current Team</h3>
        <span className="text-xs text-slate-500">
          {project.currentMembers} / {project.maxTeamSize} members
        </span>
      </div>
      <ul className="mt-3 divide-y divide-slate-100">
        {members.map((m) => (
          <li key={m.studentId} className="flex items-center gap-3 py-2.5">
            <Avatar name={m.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{m.name}</p>
              <p className="truncate text-xs text-slate-500">
                {m.role} · {m.skills.join(" • ")}
              </p>
            </div>
          </li>
        ))}
        {project.currentMembers > members.length && (
          <li className="py-2.5 text-[13px] text-slate-500">
            + {project.currentMembers - members.length} more member
            {project.currentMembers - members.length === 1 ? "" : "s"}…
          </li>
        )}
      </ul>
    </div>
  );
}

export default function ProjectDetailsPage() {
  const params = useParams<{ id: string }>();
  const { info } = useToast();
  const [project, setProject] = React.useState<Project | null | undefined>(undefined);
  const [team, setTeam] = React.useState<Team | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = await getProjectById(params.id);
      if (cancelled) return;
      setProject(p);
      if (p) setTeam((await getTeamForProject(p.id)) ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (project === undefined) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading project">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-2/3" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="mx-auto max-w-lg py-8">
        <ErrorState
          title="Project not found"
          description="This project doesn't exist or is no longer available."
        />
        <div className="mt-4 text-center">
          <Button href="/projects" variant="outline">
            <ArrowLeft className="h-4 w-4" /> Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const score = project.matchPercentage ?? 0;
  const tier = tierStyles(getMatchTier(score));

  return (
    <div>
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> All projects
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          {project.category} · {project.projectType}
        </span>
        <Badge variant={PROJECT_STATUS_BADGE[project.status]}>{project.status}</Badge>
      </div>
      <div className="mt-1.5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{project.title}</h1>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 self-start rounded-full px-3 py-1.5 text-sm font-bold ring-1 ring-inset ${tier.classes}`}
          title={tier.label}
        >
          Match {score}%
        </span>
      </div>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <Card>
            <CardContent className="py-5">
              <h2 className="font-semibold text-slate-900">About this project</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
                {project.description}
              </p>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium text-slate-600">Match score</span>
                  <span className="text-slate-500">
                    {score}% · {tier.label} (demo score)
                  </span>
                </div>
                <Progress value={score} ariaLabel={`Match score ${score} percent`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-5">
              <h2 className="font-semibold text-slate-900">Project information</h2>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                {[
                  ["Category", project.category],
                  ["Type", project.projectType],
                  ["Created by", project.creatorName],
                  ["Created", formatDate(project.createdAt)],
                  ["Deadline", formatDate(project.deadline)],
                  ["Program", `${project.program}${project.year ? ` · Year ${project.year}` : ""}`],
                  ["Team size", `${project.currentMembers} / ${project.maxTeamSize}`],
                  ["Status", project.status],
                ].map(([term, value]) => (
                  <div key={term} className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-inset ring-slate-100">
                    <dt className="text-xs text-slate-500">{term}</dt>
                    <dd className="font-medium text-slate-800">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-5">
              <h2 className="font-semibold text-slate-900">Required skills</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {project.requiredSkills.map((s) => (
                  <Badge key={s} variant="primary" className="px-3 py-1">
                    {s}
                  </Badge>
                ))}
              </div>
              <h2 className="mt-5 font-semibold text-slate-900">Project interests</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {project.interests.map((s) => (
                  <Badge key={s} variant="info" className="px-3 py-1">
                    {s}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <TeamPreview project={project} team={team} />
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-20">
          <TeamCapacity current={project.currentMembers} max={project.maxTeamSize} />
          <Card>
            <CardContent className="py-5">
              <ProjectActions project={project} />
              <button
                type="button"
                onClick={() =>
                  info("Matching preview", "Full teammate recommendations arrive in Stage 6.")
                }
                className="mt-2 inline-flex w-full items-center justify-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
              >
                Find Teammates <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
              <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-slate-400">
                <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                Applications close {formatDate(project.deadline)}.
              </p>
              <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-slate-400">
                <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                Open to {project.program}
                {project.year ? ` · Year ${project.year}` : ""} students.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
