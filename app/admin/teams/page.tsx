"use client";

import * as React from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Card, CardContent } from "@/components/ui/Card";
import { AdminTeamTable } from "@/components/admin/AdminTeamTable";
import {
  AdminTeamFilters,
  EMPTY_ADMIN_TEAM_FILTERS,
  type AdminTeamFilterValues,
} from "@/components/admin/AdminTeamFilters";
import { AdminLoadingState } from "@/components/admin/AdminStates";
import { AdminEmptyState } from "@/components/admin/AdminPanels";
import { adminDisbandTeam, adminSetTeamStatus } from "@/lib/services/admin";
import { getCurrentRole } from "@/lib/services/session";
import { listAllProjects } from "@/lib/services/projects";
import { listTeams } from "@/lib/services/teams";
import { listStudents } from "@/lib/services/students";
import type { Project, ProjectStatus, Student, Team } from "@/types";

function applyFilters(
  teams: Team[],
  projects: Project[],
  f: AdminTeamFilterValues
): Team[] {
  const q = f.query.trim().toLowerCase();
  const categoryByProject = new Map(projects.map((p) => [p.id, p.category]));
  return teams.filter((t) => {
    if (q && !`${t.projectTitle}`.toLowerCase().includes(q)) return false;
    if (f.status && t.status !== f.status) return false;
    if (f.capacity === "open" && t.members.length >= t.maxMembers) return false;
    if (f.capacity === "full" && t.members.length < t.maxMembers) return false;
    if (f.category && categoryByProject.get(t.projectId) !== f.category) return false;
    return true;
  });
}

export default function AdminTeamsPage() {
  const { success, error } = useToast();
  const [teams, setTeams] = React.useState<Team[] | null>(null);
  const [projects, setProjects] = React.useState<Project[] | null>(null);
  const [students, setStudents] = React.useState<Student[] | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [filters, setFilters] = React.useState<AdminTeamFilterValues>(EMPTY_ADMIN_TEAM_FILTERS);
  const [disbandTarget, setDisbandTarget] = React.useState<Team | null>(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    Promise.all([listTeams(), listAllProjects(), listStudents()])
      .then(([t, p, s]) => {
        setTeams(t);
        setProjects(p);
        setStudents(s);
      })
      .catch(() => setFailed(true));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const visible = React.useMemo(
    () => (teams && projects ? applyFilters(teams, projects, filters) : []),
    [teams, projects, filters]
  );
  const categoryByProject = React.useMemo(
    () => new Map((projects ?? []).map((p) => [p.id, p.category] as const)),
    [projects]
  );
  const ownerNameById = React.useMemo(() => {
    const map = new Map((students ?? []).map((s) => [s.id, s.fullName] as const));
    map.set("me", "Alex Morgan");
    return map;
  }, [students]);

  async function handleStatusChange(team: Team, status: ProjectStatus) {
    if (team.status === status) return;
    const res = await adminSetTeamStatus(team.id, status, getCurrentRole());
    if (!res.ok) {
      error("Action failed", res.error === "FORBIDDEN" ? "Admin role required." : "Team not found.");
      return;
    }
    success("Team status updated.", `${team.projectTitle} is now ${status}.`);
    load();
  }

  async function handleDisband() {
    if (!disbandTarget) return;
    setBusy(true);
    const res = await adminDisbandTeam(disbandTarget.id, getCurrentRole());
    setBusy(false);
    if (!res.ok) {
      error("Action failed", res.error === "FORBIDDEN" ? "Admin role required." : "Team not found.");
      return;
    }
    success("Team disbanded.", `${disbandTarget.projectTitle} was removed (demo).`);
    setDisbandTarget(null);
    load();
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Teams" subtitle={`${teams?.length ?? "…"} teams · capacity, health, status.`} />

      <Card>
        <CardContent className="py-5">
          <AdminTeamFilters filters={filters} onChange={setFilters} />
        </CardContent>
      </Card>

      {failed ? (
        <ErrorState title="Couldn't load teams" description="Something went wrong. Please try again." onRetry={() => { setFailed(false); load(); }} />
      ) : !teams || !projects || !students ? (
        <AdminLoadingState rows={2} />
      ) : visible.length === 0 ? (
        <AdminEmptyState title="No teams found" description="Try changing your search or filters." />
      ) : (
        <>
          <p className="text-[13px] text-slate-500" aria-live="polite">
            Showing {visible.length} of {teams.length} teams
          </p>
          <AdminTeamTable
            teams={visible}
            categoryByProject={categoryByProject}
            ownerNameById={ownerNameById}
            onStatusChange={handleStatusChange}
            onDisband={setDisbandTarget}
          />
        </>
      )}

      <Modal
        open={disbandTarget !== null}
        onClose={() => setDisbandTarget(null)}
        title={`Disband “${disbandTarget?.projectTitle ?? ""}”?`}
        description="Members keep their profiles, but the team workspace and chat history reference will be gone. This action cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDisbandTarget(null)}>Cancel</Button>
            <Button variant="danger" loading={busy} onClick={handleDisband}>
              Disband Team
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          {disbandTarget?.members.length ?? 0} member{(disbandTarget?.members.length ?? 0) === 1 ? "" : "s"} affected.
        </p>
      </Modal>
    </div>
  );
}
