"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, ListFilter, UserPlus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { tierStyles } from "@/lib/matching/score";
import {
  EMPTY_MATCH_FILTERS,
  MatchFilters,
  activeMatchFilterCount,
  type MatchFilterValues,
} from "@/components/matching/MatchFilters";
import { MatchCard, type InviteState } from "@/components/matching/MatchCard";
import { ProjectSelector } from "@/components/matching/ProjectSelector";
import { SkillGapSummary } from "@/components/matching/SkillGapSummary";
import { TeamSkillCoverage } from "@/components/matching/TeamSkillCoverage";
import { MatchViewToggle, type MatchView } from "@/components/matching/MatchViewToggle";
import { calculateMatches, type MatchResult } from "@/lib/matching/matchCalculator";
import { EMPTY_FILTERS, listProjects } from "@/lib/services/projects";
import { listStudents } from "@/lib/services/students";
import { listTeams } from "@/lib/services/teams";
import { getSessionIdentity } from "@/lib/services/session";
import { listTeamPendingRequests } from "@/lib/services/requests";
import { InvitationModal } from "@/components/requests/InvitationModal";
import { cn } from "@/lib/utils";
import type { MatchRecommendation, Project, Student, Team } from "@/types";

const EXP_RANK: Record<string, number> = { Beginner: 0, Intermediate: 1, Advanced: 2 };

function applyFilters(recs: MatchRecommendation[], f: MatchFilterValues): MatchRecommendation[] {
  const min = f.minScore ? Number(f.minScore) : 0;
  const out = recs.filter((r) => {
    if (r.score < min) return false;
    if (f.skill && !r.student.skills.includes(f.skill)) return false;
    if (f.program && r.student.program !== f.program) return false;
    if (f.year && String(r.student.year) !== f.year) return false;
    if (f.experience && r.student.experienceLevel !== f.experience) return false;
    if (f.availability && !r.student.availability.includes(f.availability as Student["availability"][number]))
      return false;
    return true;
  });
  return [...out].sort((a, b) => {
    switch (f.sort) {
      case "skill":
        return b.breakdown.skill - a.breakdown.skill || b.score - a.score;
      case "availability":
        return b.availabilityMatch - a.availabilityMatch || b.score - a.score;
      case "experience":
        return EXP_RANK[b.student.experienceLevel] - EXP_RANK[a.student.experienceLevel] || b.score - a.score;
      default:
        return b.score - a.score;
    }
  });
}

function ListRow({
  rec,
  inviteState,
  onInvite,
}: {
  rec: MatchRecommendation;
  inviteState: InviteState;
  onInvite: () => void;
}) {
  const styles = tierStyles(rec.tier);
  const disabled = inviteState !== "idle";
  const label =
    inviteState === "member"
      ? "Member"
      : inviteState === "pending"
        ? "Sent"
        : inviteState === "full"
          ? "Full"
          : "Invite";
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[var(--shadow-card)]">
      <Avatar name={rec.student.fullName} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">
          <Link href={`/profile/${rec.student.id}`} className="hover:text-brand-700 hover:underline">
            {rec.student.fullName}
          </Link>
        </p>
        <p className="truncate text-xs text-slate-500">
          {rec.matchingSkills.slice(0, 3).join(", ") || rec.student.program}
        </p>
      </div>
      <span className={cn("hidden rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset sm:inline-block", styles.classes)}>
        {rec.score}%
      </span>
      <span className="rounded-full px-2.5 py-1 text-xs font-bold tabular-nums text-slate-700 sm:hidden">
        {rec.score}%
      </span>
      <Button
        size="sm"
        variant={disabled ? "secondary" : "primary"}
        disabled={disabled}
        onClick={onInvite}
        aria-label={disabled ? `${label}: ${rec.student.fullName}` : `Invite ${rec.student.fullName}`}
      >
        {disabled ? (
          <>
            <Check className="h-3.5 w-3.5" /> {label}
          </>
        ) : (
          <>
            <UserPlus className="h-3.5 w-3.5" /> Invite
          </>
        )}
      </Button>
    </li>
  );
}

/**
 * Matching page: project → engine → ranked, explained recommendations.
 * UI → services (projects/students/teams) → lib/matching/* (pure).
 */
export default function MatchesPage() {
  const [projects, setProjects] = React.useState<Project[] | null>(null);
  const [students, setStudents] = React.useState<Student[] | null>(null);
  const [teams, setTeams] = React.useState<Team[] | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string>("");
  const [filters, setFilters] = React.useState<MatchFilterValues>(EMPTY_MATCH_FILTERS);
  const [view, setView] = React.useState<MatchView>("grid");
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [inviteTarget, setInviteTarget] = React.useState<MatchRecommendation | null>(null);
  const [justSent, setJustSent] = React.useState<Set<string>>(new Set());
  const [myId, setMyId] = React.useState("me");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const identity = await getSessionIdentity();
      const [p, s, t] = await Promise.all([listProjects(EMPTY_FILTERS), listStudents(), listTeams()]);
      if (cancelled) return;
      const mine = p.filter((proj) => proj.creatorId === identity.id);
      setMyId(identity.id);
      setProjects(mine);
      setStudents(s);
      setTeams(t);
      setSelectedId(mine[0]?.id ?? "");
    })().catch(() => {
      if (!cancelled) setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Pending invite states for the selected team (works in both modes).
  const [pending, setPending] = React.useState<{ teamId: string; ids: Set<string> }>({
    teamId: "",
    ids: new Set(),
  });
  React.useEffect(() => {
    if (!selectedId || !teams) return;
    const team = teams.find((t) => t.projectId === selectedId);
    if (!team) return;
    let cancelled = false;
    listTeamPendingRequests(team.id).then((reqs) => {
      if (cancelled) return;
      setPending({
        teamId: team.id,
        ids: new Set(reqs.flatMap((r) => [r.senderId, r.recipientId])),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId, teams, justSent]);

  const result: MatchResult | null = React.useMemo(() => {
    if (!projects || !students || !teams || !selectedId) return null;
    const project = projects.find((p) => p.id === selectedId);
    if (!project) return null;
    return calculateMatches(
      {
        project,
        team: teams.find((t) => t.projectId === project.id),
        studentsById: new Map(students.map((s) => [s.id, s])),
        currentUserId: myId,
      },
      students
    );
  }, [projects, students, teams, selectedId, myId]);

  const visible = React.useMemo(
    () => (result ? applyFilters(result.recommendations, filters) : []),
    [result, filters]
  );

  const memberIds = React.useMemo(() => {
    const project = projects?.find((p) => p.id === selectedId);
    const team = teams?.find((t) => t.projectId === project?.id);
    return new Set(team?.members.map((m) => m.studentId) ?? []);
  }, [projects, teams, selectedId]);

  const selectedTeam = React.useMemo(() => {
    const project = projects?.find((p) => p.id === selectedId);
    return teams?.find((t) => t.projectId === project?.id) ?? null;
  }, [projects, teams, selectedId]);

  function inviteStateFor(rec: MatchRecommendation): InviteState {
    if (memberIds.has(rec.student.id)) return "member";
    if (justSent.has(rec.student.id)) return "pending";
    if (selectedTeam && pending.teamId === selectedTeam.id && pending.ids.has(rec.student.id))
      return "pending";
    if (result?.teamFull) return "full";
    return "idle";
  }

  if (!projects || !students || !teams) {
    if (failed) {
      return (
        <div className="space-y-6">
          <PageHeader title="Find Teammates" subtitle="Discover students who complement your project's requirements." />
          <ErrorState
            title="Couldn't load matching data"
            description="Something went wrong. Please try again."
            onRetry={() => window.location.reload()}
          />
        </div>
      );
    }
    return (
      <div className="space-y-5" role="status" aria-label="Loading recommendations">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <Skeleton className="h-12 w-full max-w-md" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="space-y-3 py-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Find Teammates"
          subtitle="Discover students who complement your project's requirements and your existing team's skills."
        />
        <EmptyState
          title="You don't have a project yet"
          description="Create a project to start finding teammates."
          actionLabel="Create Project"
          actionHref="/projects/create"
        />
      </div>
    );
  }

  const project = projects.find((p) => p.id === selectedId);
  const filterCount = activeMatchFilterCount(filters);

  return (
    <div>
      <PageHeader
        title="Find Teammates"
        subtitle="Discover students who complement your project's requirements and your existing team's skills."
        actions={
          <MatchViewToggle view={view} onChange={setView} />
        }
      />

      <div className="mt-5">
        <ProjectSelector projects={projects} value={selectedId} onChange={setSelectedId} />
      </div>

      {result?.teamFull ? (
        <Card className="mt-5">
          <CardContent className="py-8 text-center">
            <h2 className="font-semibold text-slate-900">Team is full</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              {project?.title} already has {project?.maxTeamSize} members. No
              additional teammate recommendations available.
            </p>
            <div className="mt-4">
              <Button href="/teams" variant="outline" size="sm">
                View My Teams
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="min-w-0 space-y-4">
            <div className="lg:hidden">
              <Button
                variant="outline"
                onClick={() => setFiltersOpen((v) => !v)}
                aria-expanded={filtersOpen}
                className="w-full"
              >
                <ListFilter className="h-4 w-4" />
                {filtersOpen ? "Hide Filters" : "Show Filters"}
                {filterCount > 0 && (
                  <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-bold text-white">
                    {filterCount}
                  </span>
                )}
              </Button>
            </div>
            <div className={cn("space-y-4 lg:block", filtersOpen ? "block" : "hidden")}>
              {result && (
                <>
                  <SkillGapSummary team={result.teamState} />
                  <TeamSkillCoverage team={result.teamState} />
                </>
              )}
              <Card>
                <CardContent className="py-5">
                  <MatchFilters
                    filters={filters}
                    onChange={setFilters}
                    onClear={() => setFilters(EMPTY_MATCH_FILTERS)}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Recommended Teammates</h2>
                <p className="mt-0.5 text-sm text-slate-500" aria-live="polite">
                  {visible.length} student{visible.length === 1 ? "" : "s"} for {project?.title}
                </p>
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="No suitable teammates found"
                  description="Try expanding your search, adjusting project requirements, or lowering the minimum match."
                  actionLabel="Clear Filters"
                  onAction={() => setFilters(EMPTY_MATCH_FILTERS)}
                />
              </div>
            ) : view === "grid" ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visible.map((rec) => (
                  <MatchCard
                    key={rec.student.id}
                    rec={rec}
                    inviteState={inviteStateFor(rec)}
                    onInvite={setInviteTarget}
                  />
                ))}
              </div>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {visible.map((rec) => (
                  <ListRow
                    key={rec.student.id}
                    rec={rec}
                    inviteState={inviteStateFor(rec)}
                    onInvite={() => setInviteTarget(rec)}
                  />
                ))}
              </ul>
            )}

            <p className="mt-5 text-center text-xs text-slate-400">
              Scores combine skills (40%), interests (20%), availability (15%),
              program (10%), experience (10%), year (5%).{" "}
              <Link href="/projects" className="inline-flex items-center gap-0.5 font-medium text-brand-700 hover:underline">
                Browse projects <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            </p>
          </div>
        </div>
      )}

      <InvitationModal
        open={inviteTarget !== null}
        student={inviteTarget?.student ?? null}
        team={selectedTeam}
        gapSkills={inviteTarget?.missingSkillsCovered ?? []}
        match={inviteTarget?.score}
        onClose={() => setInviteTarget(null)}
        onSent={(studentId) => setJustSent((prev) => new Set(prev).add(studentId))}
      />
    </div>
  );
}
