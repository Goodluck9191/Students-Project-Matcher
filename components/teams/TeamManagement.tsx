"use client";

import { Select } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { allowedStatuses, openPositions } from "@/lib/services/teams";
import type { ProjectStatus, Team } from "@/types";

/** Owner-only management panel: membership, roles hint, status control. */
export function TeamManagement({
  team,
  onStatusChange,
  changing,
}: {
  team: Team;
  onStatusChange: (status: ProjectStatus) => void;
  changing: boolean;
}) {
  return (
    <Card className="border-brand-200">
      <CardContent className="py-5">
        <h3 className="font-semibold text-slate-900">Team Management</h3>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-inset ring-slate-100">
            <dt className="text-xs text-slate-500">Members</dt>
            <dd className="font-semibold text-slate-900">
              {team.members.length} / {team.maxMembers}
            </dd>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-inset ring-slate-100">
            <dt className="text-xs text-slate-500">Open positions</dt>
            <dd className="font-semibold text-slate-900">{openPositions(team)}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-inset ring-slate-100">
            <dt className="text-xs text-slate-500">Roles</dt>
            <dd className="font-semibold text-slate-900">
              {new Set(team.members.map((m) => m.role)).size} assigned
            </dd>
          </div>
        </dl>
        <div className="mt-4 max-w-xs">
          <Select
            label="Project status"
            name="team-status"
            options={allowedStatuses(team.status)}
            value={team.status}
            onChange={(e) => onStatusChange(e.target.value as ProjectStatus)}
            hint={changing ? "Saving…" : "Visible to all members immediately."}
          />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Change a member&apos;s role or remove them from their member card
          below. Removals always ask for confirmation first.
        </p>
      </CardContent>
    </Card>
  );
}
