"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Pencil, UserPlus, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { isProjectOwner } from "@/lib/services/projects";
import {
  REQUEST_ERROR_MESSAGES,
  getUserProjectRequest,
  sendJoinRequest,
} from "@/lib/services/requests";
import { getTeamForProject, isTeamFull } from "@/lib/services/teams";
import { getSessionIdentity } from "@/lib/services/session";
import type { Project, Team } from "@/types";

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
  const [myId, setMyId] = React.useState("me");
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const identity = await getSessionIdentity();
      if (cancelled) return;
      setMyId(identity.id);
      setTeam((await getTeamForProject(project.id)) ?? null);
      setPendingId(
        (await getUserProjectRequest(project.id, identity.id))?.id ?? null
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [project.id, nonce]);

  if (isProjectOwner(project, myId)) {
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

  const isMember = team?.members.some((m) => m.studentId === myId) ?? false;
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
    const res = await sendJoinRequest({ projectId: project.id, senderId: myId });
    setSending(false);
    if (!res.ok) {
      error("Couldn't send the request", REQUEST_ERROR_MESSAGES[res.error]);
      return;
    }
    success("Request sent", "The project owner has been notified.");
    setNonce((n) => n + 1);
  }

  return (
    <Button className="w-full" loading={sending} onClick={handleJoin}>
      <UserPlus className="h-4 w-4" /> Request to Join
    </Button>
  );
}
