"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Pencil, UserPlus, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { isProjectOwner } from "@/lib/services/projects";
import {
  REQUEST_ERROR_MESSAGES,
  findUserProjectRequest,
  sendJoinRequest,
} from "@/lib/services/requests";
import { getTeamForProject, isTeamFull } from "@/lib/services/teams";
import type { Project, Team } from "@/types";

const CURRENT_USER = "me";

/**
 * Contextual CTA block for project details, driven by live request/team
 * state: owner → Edit + Manage; member → Team Member; pending → Pending;
 * full → Team Full; otherwise Request to Join (join_request flow).
 */
export function ProjectActions({ project }: { project: Project }) {
  const { success, error } = useToast();
  const [team, setTeam] = React.useState<Team | null>(null);
  const [sending, setSending] = React.useState(false);
  const [nonce, setNonce] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    getTeamForProject(project.id).then((t) => {
      if (!cancelled) setTeam(t ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [project.id, nonce]);

  // Derived each render (bumped by nonce) so sent requests reflect immediately.
  const pendingId = findUserProjectRequest(project.id, CURRENT_USER)?.id ?? null;

  if (isProjectOwner(project)) {
    return (
      <div className="flex flex-col gap-2">
        <Button href={`/projects/${project.id}/edit`} className="w-full">
          <Pencil className="h-4 w-4" /> Edit Project
        </Button>
        <Button href="/teams" variant="outline" className="w-full">
          <UsersRound className="h-4 w-4" /> Manage Team
        </Button>
        <Link href="/matches" className="mt-1 text-center text-sm font-semibold text-brand-700 hover:underline">
          Find Teammates →
        </Link>
      </div>
    );
  }

  const isMember = team?.members.some((m) => m.studentId === CURRENT_USER) ?? false;
  if (isMember && team) {
    return (
      <div className="flex flex-col gap-2">
        <Button variant="secondary" disabled className="w-full">
          <Check className="h-4 w-4" /> Team Member
        </Button>
        <Button href={`/teams/${team.id}`} variant="outline" className="w-full">
          Open Team Workspace
        </Button>
      </div>
    );
  }

  const full = team ? isTeamFull(team) : project.currentMembers >= project.maxTeamSize;
  if (full) {
    return (
      <Button disabled className="w-full">
        Team Full
      </Button>
    );
  }

  if (pendingId) {
    return (
      <div className="flex flex-col gap-2">
        <Button variant="secondary" disabled className="w-full">
          <Check className="h-4 w-4" /> Request Pending
        </Button>
        <Link href="/requests" className="text-center text-sm font-medium text-slate-500 hover:text-slate-800 hover:underline">
          View in Requests
        </Link>
      </div>
    );
  }

  async function handleJoin() {
    setSending(true);
    const res = await sendJoinRequest({ projectId: project.id, senderId: CURRENT_USER });
    setSending(false);
    if (!res.ok) {
      error("Couldn't send the request", REQUEST_ERROR_MESSAGES[res.error]);
      return;
    }
    success("Request sent", "The project owner has been notified (demo mode).");
    setNonce((n) => n + 1);
  }

  return (
    <Button className="w-full" loading={sending} onClick={handleJoin}>
      <UserPlus className="h-4 w-4" /> Request to Join
    </Button>
  );
}
