"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { TeamCapacity } from "@/components/projects/TeamCapacity";
import { TeamSkillCoverage } from "@/components/matching/TeamSkillCoverage";
import { TeamHeader } from "@/components/teams/TeamHeader";
import { TeamMemberList } from "@/components/teams/TeamMemberCard";
import { TeamSkillGaps } from "@/components/teams/TeamSkillGaps";
import { TeamProgress } from "@/components/teams/TeamProgress";
import { TeamActivity } from "@/components/teams/TeamActivity";
import { TeamActions } from "@/components/teams/TeamActions";
import { TeamManagement } from "@/components/teams/TeamManagement";
import { analyzeTeam } from "@/lib/matching/teamBalancer";
import { getSessionIdentity } from "@/lib/services/session";
import {
  canLeaveTeam,
  canManageMembers,
  enrichMember,
  getTeamActivity,
  getTeamById,
  getTeamSkillGaps,
  isTeamOwner,
  leaveTeam,
  removeMember,
  updateMemberRole,
  updateTeamStatus,
} from "@/lib/services/teams";
import { getProjectById } from "@/lib/services/projects";
import { listStudents } from "@/lib/services/students";
import { formatDate } from "@/lib/utils";
import {
  TEAM_ROLE_OPTIONS,
  type Project,
  type ProjectStatus,
  type SkillWithLevel,
  type Student,
  type Team,
  type TeamActivityItem,
  type TeamMember,
} from "@/types";

/**
 * Team workspace: project + members + skills + progress + activity.
 * Mutations run through lib/services/teams.ts (session state, mock).
 */
export default function TeamDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { success, error } = useToast();

  const [team, setTeam] = React.useState<Team | null | undefined>(undefined);
  const [project, setProject] = React.useState<Project | null>(null);
  const [students, setStudents] = React.useState<Student[] | null>(null);
  const [activity, setActivity] = React.useState<TeamActivityItem[]>([]);
  const [roleTarget, setRoleTarget] = React.useState<TeamMember | null>(null);
  const [roleValue, setRoleValue] = React.useState<string>("");
  const [removeTarget, setRemoveTarget] = React.useState<TeamMember | null>(null);
  const [leaveOpen, setLeaveOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [statusBusy, setStatusBusy] = React.useState(false);
  const [myId, setMyId] = React.useState("me");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const identity = await getSessionIdentity();
      const [t, s] = await Promise.all([getTeamById(params.id), listStudents()]);
      if (cancelled) return;
      setMyId(identity.id);
      setTeam(t);
      setStudents(s);
      if (t) {
        setActivity(await getTeamActivity(t.id));
        setProject(await getProjectById(t.projectId));
      }
    })().catch(() => {
      if (!cancelled) setTeam(null);
    });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const studentsById = React.useMemo(
    () => new Map((students ?? []).map((s) => [s.id, s])),
    [students]
  );
  const levelsByStudent = React.useMemo(() => {
    const map = new Map<string, SkillWithLevel[] | undefined>();
    for (const s of students ?? []) map.set(s.id, s.skillLevels);
    return map;
  }, [students]);

  const gaps = React.useMemo(
    () => (project && team ? getTeamSkillGaps(project, team, studentsById) : []),
    [project, team, studentsById]
  );

  const engineState = React.useMemo(() => {
    if (!project || !team) return null;
    const availability = new Map<string, readonly string[]>();
    const experience = new Map<string, "Beginner" | "Intermediate" | "Advanced">();
    for (const m of team.members) {
      const s = studentsById.get(m.studentId);
      if (s) {
        availability.set(m.studentId, s.availability);
        experience.set(m.studentId, s.experienceLevel);
      }
    }
    return analyzeTeam({
      requiredSkills: project.requiredSkills,
      team,
      memberAvailability: availability,
      memberExperience: experience,
      maxMembers: team.maxMembers,
    });
  }, [project, team, studentsById]);

  async function refreshActivity() {
    setActivity(await getTeamActivity(params.id));
  }

  async function handleRoleSave() {
    if (!roleTarget || !roleValue) return;
    setBusy(true);
    const res = await updateMemberRole(team!.id, roleTarget.studentId, roleValue, myId);
    setBusy(false);
    if (!res.ok) {
      error("Couldn't update the role", "You don't have permission to manage members.");
      return;
    }
    setTeam(res.team);
    setRoleTarget(null);
    success("Role updated", `${roleTarget.name} is now ${roleValue}.`);
    void refreshActivity();
  }

  async function handleRemoveConfirm() {
    if (!removeTarget) return;
    setBusy(true);
    const res = await removeMember(team!.id, removeTarget.studentId, myId);
    setBusy(false);
    if (!res.ok) {
      error("Couldn't remove the member", "Please try again.");
      return;
    }
    setTeam(res.team);
    setRemoveTarget(null);
    success("Member removed", `${removeTarget.name} is no longer on this team (demo).`);
    void refreshActivity();
  }

  async function handleLeaveConfirm() {
    setBusy(true);
    const res = await leaveTeam(team!.id, myId);
    setBusy(false);
    if (!res.ok) {
      error(
        "You can't leave this team",
        res.error === "OWNER_CANNOT_LEAVE"
          ? "Transfer ownership first — arriving in a later stage."
          : "Please try again."
      );
      return;
    }
    setLeaveOpen(false);
    success("You left the team", "Demo change only — nothing persisted server-side.");
    router.push("/teams");
  }

  async function handleStatusChange(status: ProjectStatus) {
    if (!team || status === team.status) return;
    setStatusBusy(true);
    const res = await updateTeamStatus(team.id, status, myId);
    setStatusBusy(false);
    if (!res.ok) {
      error("Couldn't update the status", "Please try again.");
      return;
    }
    setTeam(res.team);
    success("Status updated", `The team is now ${status}.`);
    void refreshActivity();
  }

  if (team === undefined || !students) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading team">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-2/3" />
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (team === null) {
    return (
      <div className="mx-auto max-w-lg py-8">
        <ErrorState
          title="Team not found"
          description="This team doesn't exist or is no longer available."
        />
        <div className="mt-4 text-center">
          <Button href="/teams" variant="outline">
            <ArrowLeft className="h-4 w-4" /> Back to My Teams
          </Button>
        </div>
      </div>
    );
  }

  const owner = isTeamOwner(team, myId);
  const canManage = canManageMembers(team, myId);
  const canLeave = canLeaveTeam(team, myId);

  return (
    <div>
      <TeamHeader team={team} category={project?.category ?? "Project"} />

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          {owner && (
            <TeamManagement team={team} onStatusChange={handleStatusChange} changing={statusBusy} />
          )}

          <Card>
            <CardContent className="py-5">
              <h2 className="font-semibold text-slate-900">Project overview</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
                {project?.description ?? team.projectTitle}
              </p>
              {project && (
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  {[
                    ["Program", `${project.program}${project.year ? ` · Year ${project.year}` : ""}`],
                    ["Deadline", formatDate(project.deadline)],
                    ["Team size", `${team.members.length} / ${team.maxMembers}`],
                    ["Type", project.projectType],
                  ].map(([term, value]) => (
                    <div key={term} className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-inset ring-slate-100">
                      <dt className="text-xs text-slate-500">{term}</dt>
                      <dd className="font-medium text-slate-800">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <div className="mt-3">
                <p className="text-xs font-medium text-slate-500">Required skills</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {(project?.requiredSkills ?? team.skillsCovered).map((s) => (
                    <Badge key={s} variant="primary">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              {project && project.interests.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-slate-500">Interests</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {project.interests.map((s) => (
                      <Badge key={s} variant="info">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <section aria-labelledby="team-members">
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="team-members" className="text-lg font-bold text-slate-900">
                Team Members
              </h2>
              <span className="text-xs text-slate-500">
                {team.members.length} / {team.maxMembers}
              </span>
            </div>
            <div className="mt-3">
              <TeamMemberList
                members={team.members.map((m) => enrichMember(m, studentsById))}
                levelsByStudent={levelsByStudent}
                selfId={myId}
                ownerId={team.ownerId}
                canManage={canManage}
                onChangeRole={(m) => {
                  setRoleTarget(m);
                  setRoleValue(m.role);
                }}
                onRemove={setRemoveTarget}
              />
            </div>
          </section>

          {engineState && <TeamSkillCoverage team={engineState} />}
          <TeamSkillGaps gaps={gaps} />
          <TeamActivity items={activity} />

          <Card>
            <CardContent className="flex items-center gap-3 py-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <MessageCircle className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-slate-900">Team Chat</h3>
                <p className="mt-0.5 text-sm text-slate-500">
                  Coordinate work, meetings, and decisions with your team.
                </p>
              </div>
              <Button href={`/teams/${team.id}/chat`} size="sm" className="shrink-0">
                Open Chat
              </Button>
            </CardContent>
          </Card>
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-20">
          <TeamCapacity current={team.members.length} max={team.maxMembers} />
          <TeamProgress team={team} />
          <TeamActions
            team={team}
            isOwner={owner}
            canLeave={canLeave}
            onLeave={() => setLeaveOpen(true)}
          />
        </aside>
      </div>

      <Modal
        open={roleTarget !== null}
        onClose={() => setRoleTarget(null)}
        title={`Change role — ${roleTarget?.name ?? ""}`}
        description="Roles describe responsibilities, not skills. A React developer can hold any role."
        footer={
          <>
            <Button variant="outline" onClick={() => setRoleTarget(null)}>
              Cancel
            </Button>
            <Button loading={busy} onClick={handleRoleSave} disabled={!roleValue}>
              Save Role
            </Button>
          </>
        }
      >
        <Select
          label="Role"
          name="member-role"
          options={TEAM_ROLE_OPTIONS}
          value={TEAM_ROLE_OPTIONS.includes(roleValue as (typeof TEAM_ROLE_OPTIONS)[number]) ? roleValue : ""}
          onChange={(e) => setRoleValue(e.target.value)}
          placeholder="Select a role…"
        />
      </Modal>

      <Modal
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        title={`Remove ${removeTarget?.name ?? "member"}?`}
        description={`${removeTarget?.name ?? "They"} will no longer be a member of this team.`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={busy} onClick={handleRemoveConfirm}>
              Remove Member
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Their contributions stay with the project record in this demo.
        </p>
      </Modal>

      <Modal
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title="Leave this team?"
        description="You will no longer have access to this team's workspace."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setLeaveOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={busy} onClick={handleLeaveConfirm}>
              Leave Team
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          You can rejoin later if the team still has open positions.
        </p>
      </Modal>
    </div>
  );
}
