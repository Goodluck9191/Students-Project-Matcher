"use client";

import * as React from "react";
import { Compass, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { TeamCard } from "@/components/teams/TeamCard";
import { listMyTeams } from "@/lib/services/teams";
import { listProjects, EMPTY_FILTERS } from "@/lib/services/projects";
import { listStudents } from "@/lib/services/students";
import { getSessionIdentity } from "@/lib/services/session";
import { getUnreadMessageCountAsync } from "@/lib/services/chat";
import type { Project, Student, Team } from "@/types";

/** Teams dashboard — every team the current user belongs to. */
export default function TeamsPage() {
  const [teams, setTeams] = React.useState<Team[] | null>(null);
  const [projects, setProjects] = React.useState<Project[] | null>(null);
  const [students, setStudents] = React.useState<Student[] | null>(null);
  const [unreadByTeam, setUnreadByTeam] = React.useState<Map<string, number>>(new Map());
  const [myId, setMyId] = React.useState("me");
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const identity = await getSessionIdentity();
      const [t, p, s] = await Promise.all([
        listMyTeams(identity.id),
        listProjects(EMPTY_FILTERS),
        listStudents(),
      ]);
      if (cancelled) return;
      setMyId(identity.id);
      setTeams(t);
      setProjects(p);
      setStudents(s);
      const counts = await Promise.all(
        t.map(async (team) => [team.id, await getUnreadMessageCountAsync(team.id, identity.id)] as const)
      );
      if (!cancelled) setUnreadByTeam(new Map(counts));
    })().catch(() => {
      if (!cancelled) setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Teams" subtitle="Manage your project teams, members, skills, and project progress." />
        <ErrorState
          title="Couldn't load your teams"
          description="Something went wrong. Please try again."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (!teams || !projects || !students) {
    return (
      <div className="space-y-5" role="status" aria-label="Loading teams">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="space-y-3 py-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const projectById = new Map(projects.map((p) => [p.id, p]));
  const studentById = new Map(students.map((s) => [s.id, s]));

  return (
    <div>
      <PageHeader
        title="My Teams"
        subtitle="Manage your project teams, members, skills, and project progress."
        actions={
          <>
            <Button href="/projects" variant="outline">
              <Compass className="h-4 w-4" /> Browse Projects
            </Button>
            <Button href="/projects/create">
              <Plus className="h-4 w-4" /> Start Project Team
            </Button>
          </>
        }
      />

      {teams.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="You haven't joined a team yet"
            description="Find a project and start building your ideal project team."
            actionLabel="Browse Projects"
            actionHref="/projects"
          />
        </div>
      ) : (
        <>
          <p className="mt-4 text-[13px] text-slate-500" aria-live="polite">
            {teams.length} team{teams.length === 1 ? "" : "s"} · teams form from
            projects via matching and invitations.
          </p>
          <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                category={projectById.get(team.projectId)?.category ?? "Project"}
                unread={unreadByTeam.get(team.id) ?? 0}
                ownerName={
                  team.ownerId === myId
                    ? "You"
                    : (studentById.get(team.ownerId)?.fullName ??
                      team.members.find((m) => m.studentId === team.ownerId)?.name ??
                      "Unknown")
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
