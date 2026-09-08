"use client";

import * as React from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Card, CardContent } from "@/components/ui/Card";
import { AdminProjectTable } from "@/components/admin/AdminProjectTable";
import {
  AdminProjectFilters,
  EMPTY_ADMIN_PROJECT_FILTERS,
  type AdminProjectFilterValues,
} from "@/components/admin/AdminProjectFilters";
import { AdminLoadingState } from "@/components/admin/AdminStates";
import { AdminEmptyState } from "@/components/admin/AdminPanels";
import {
  adminArchiveProject,
  adminDeleteProject,
  adminSetProjectStatus,
} from "@/lib/services/admin";
import { getCurrentRole } from "@/lib/services/session";
import { listAllProjects } from "@/lib/services/projects";
import { listTeams } from "@/lib/services/teams";
import type { Project, ProjectStatus, Team } from "@/types";

function applyFilters(projects: Project[], teams: Team[], f: AdminProjectFilterValues): Project[] {
  const q = f.query.trim().toLowerCase();
  const teamProjectIds = new Set(teams.map((t) => t.projectId));
  const fullIds = new Set(teams.filter((t) => t.members.length >= t.maxMembers).map((t) => t.projectId));
  return projects.filter((p) => {
    if (q && !`${p.title} ${p.creatorName} ${p.category}`.toLowerCase().includes(q)) return false;
    if (f.status === "Draft") return false; // No draft state in mock mode yet.
    if (f.status && p.status !== f.status) return false;
    if (f.category && p.category !== f.category) return false;
    if (f.teamState === "no-team" && teamProjectIds.has(p.id)) return false;
    if (f.teamState === "recruiting" && (fullIds.has(p.id) || !teamProjectIds.has(p.id))) return false;
    if (f.teamState === "complete" && !fullIds.has(p.id)) return false;
    return true;
  });
}

export default function AdminProjectsPage() {
  const { success, error } = useToast();
  const [projects, setProjects] = React.useState<Project[] | null>(null);
  const [teams, setTeams] = React.useState<Team[] | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [filters, setFilters] = React.useState<AdminProjectFilterValues>(EMPTY_ADMIN_PROJECT_FILTERS);
  const [archiveTarget, setArchiveTarget] = React.useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Project | null>(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    Promise.all([listAllProjects(), listTeams()])
      .then(([p, t]) => {
        setProjects(p);
        setTeams(t);
      })
      .catch(() => setFailed(true));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const visible = React.useMemo(
    () => (projects && teams ? applyFilters(projects, teams, filters) : []),
    [projects, teams, filters]
  );
  const teamCountByProject = React.useMemo(
    () => new Map((teams ?? []).map((t) => [t.projectId, t.members.length] as const)),
    [teams]
  );

  async function mutate(
    fn: () => Promise<{ ok: true } | { ok: false; error: string }>,
    okMessage: [string, string],
    done: () => void
  ) {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (!res.ok) {
      error("Action failed", res.error === "FORBIDDEN" ? "Admin role required." : "Project not found.");
      return;
    }
    done();
    success(okMessage[0], okMessage[1]);
    load();
  }

  async function handleStatusChange(project: Project, status: ProjectStatus) {
    if (project.status === status) return;
    const res = await adminSetProjectStatus(project.id, status, getCurrentRole());
    if (!res.ok) {
      error("Action failed", res.error === "FORBIDDEN" ? "Admin role required." : "Project not found.");
      return;
    }
    success("Project status updated", `${project.title} is now ${status}.`);
    load();
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Projects" subtitle={`${projects?.length ?? "…"} projects · status, archive, delete.`} />

      <Card>
        <CardContent className="py-5">
          <AdminProjectFilters filters={filters} onChange={setFilters} />
        </CardContent>
      </Card>

      {failed ? (
        <ErrorState title="Couldn't load projects" description="Something went wrong. Please try again." onRetry={() => { setFailed(false); load(); }} />
      ) : !projects || !teams ? (
        <AdminLoadingState rows={2} />
      ) : visible.length === 0 ? (
        <AdminEmptyState title="No projects found" description="Try changing your search or filters." />
      ) : (
        <>
          <p className="text-[13px] text-slate-500" aria-live="polite">
            Showing {visible.length} of {projects.length} projects
          </p>
          <AdminProjectTable
            projects={visible}
            teamCountByProject={teamCountByProject}
            onStatusChange={handleStatusChange}
            onArchive={setArchiveTarget}
            onDelete={setDeleteTarget}
          />
        </>
      )}

      <Modal
        open={archiveTarget !== null}
        onClose={() => setArchiveTarget(null)}
        title={`Archive “${archiveTarget?.title ?? ""}”?`}
        description="Archived projects disappear from student discovery but stay in reports and history."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setArchiveTarget(null)}>Cancel</Button>
            <Button
              loading={busy}
              onClick={() =>
                mutate(
                  () => adminArchiveProject(archiveTarget!.id, getCurrentRole()),
                  ["Project archived successfully.", archiveTarget!.title],
                  () => setArchiveTarget(null)
                )
              }
            >
              Archive Project
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Teams already formed keep working normally.</p>
      </Modal>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete Project?"
        description={`“${deleteTarget?.title ?? ""}” will be permanently removed. This action cannot be undone.`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="danger"
              loading={busy}
              onClick={() =>
                mutate(
                  () => adminDeleteProject(deleteTarget!.id, getCurrentRole()),
                  ["Project deleted.", deleteTarget!.title],
                  () => setDeleteTarget(null)
                )
              }
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Prefer hiding it from students? Archive instead.</p>
      </Modal>
    </div>
  );
}
