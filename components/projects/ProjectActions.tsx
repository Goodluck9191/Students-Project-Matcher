"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Pencil, UserPlus, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { isProjectOwner } from "@/lib/services/projects";
import { mockRequests } from "@/lib/mock/requests";
import type { Project } from "@/types";

/**
 * Contextual CTA block for project details:
 * owner → Edit + Manage Team; non-owner → Request to Join / Pending / Full.
 * All interactions are mock/local state (no persistence).
 */
export function ProjectActions({ project }: { project: Project }) {
  const { success, info } = useToast();
  const [requested, setRequested] = React.useState(() =>
    mockRequests.some(
      (r) =>
        r.direction === "sent" && r.projectId === project.id && r.status === "pending"
    )
  );

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

  const full = project.currentMembers >= project.maxTeamSize;

  if (full) {
    return (
      <Button disabled className="w-full">
        Team Full
      </Button>
    );
  }

  if (requested) {
    return (
      <Button variant="secondary" disabled className="w-full">
        <Check className="h-4 w-4" /> Request Pending
      </Button>
    );
  }

  return (
    <Button
      className="w-full"
      onClick={() => {
        setRequested(true);
        success("Request sent", `${project.title} · demo mode, nothing persisted.`);
        info("Tip", "Track it under Requests in Stage 8.");
      }}
    >
      <UserPlus className="h-4 w-4" /> Request to Join
    </Button>
  );
}
