"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { allowedStatuses, openPositions } from "@/lib/services/teams";
import type { ProjectStatus, Team } from "@/types";

/** Owner-only management panel: membership, status, ownership transfer. */
export function TeamManagement({
  team,
  onStatusChange,
  changing,
  onTransferOwnership,
  transferring,
}: {
  team: Team;
  onStatusChange: (status: ProjectStatus) => void;
  changing: boolean;
  onTransferOwnership: (newOwnerId: string) => void;
  transferring: boolean;
}) {
  const [candidate, setCandidate] = React.useState("");
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const others = team.members.filter((m) => m.studentId !== team.ownerId);
  const candidateName = others.find((m) => m.studentId === candidate)?.name ?? "";

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
        <div className="mt-4 border-t border-slate-100 pt-4">
          <h4 className="text-sm font-semibold text-slate-900">Transfer ownership</h4>
          <p className="mt-0.5 text-[13px] text-slate-500">
            The new owner gains full management rights; you become a normal member and can then leave.
          </p>
          {others.length === 0 ? (
            <p className="mt-2 text-[13px] text-slate-500">
              Invite members first — ownership can only go to a team member.
            </p>
          ) : (
            <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor="transfer-owner">New owner</label>
              <select
                id="transfer-owner"
                value={candidate}
                onChange={(e) => setCandidate(e.target.value)}
                className="h-10 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                <option value="">Select team member…</option>
                {others.map((m) => (
                  <option key={m.studentId} value={m.studentId}>
                    {m.name} · {m.role}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                disabled={!candidate}
                onClick={() => setConfirmOpen(true)}
                className="shrink-0"
              >
                Transfer
              </Button>
            </div>
          )}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Change a member&apos;s role or remove them from their member card
          below. Removals always ask for confirmation first.
        </p>
      </CardContent>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={`Transfer ownership to ${candidateName}?`}
        description="They will gain full team management rights and you will become a normal member."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={transferring}
              onClick={() => {
                onTransferOwnership(candidate);
                setConfirmOpen(false);
                setCandidate("");
              }}
            >
              Transfer Ownership
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">This takes effect immediately for the whole team.</p>
      </Modal>
    </Card>
  );
}
