"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import {
  REQUEST_ERROR_MESSAGES,
  sendTeamInvitation,
} from "@/lib/services/requests";
import { isTeamFull, openPositions } from "@/lib/services/teams";
import type { Student, Team } from "@/types";

/**
 * Invite-to-team confirmation modal (matches page + anywhere owners invite).
 * Eligibility is re-checked server-side by the service; failures surface
 * as friendly messages, never silent no-ops.
 */
export function InvitationModal({
  open,
  student,
  team,
  gapSkills,
  match,
  onClose,
  onSent,
}: {
  open: boolean;
  student: Student | null;
  team: Team | null;
  gapSkills: string[];
  match?: number;
  onClose: () => void;
  onSent: (studentId: string) => void;
}) {
  const { success, error } = useToast();
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  function handleClose() {
    setMessage("");
    onClose();
  }

  if (!student || !team) return null;
  const full = isTeamFull(team);

  async function handleSend() {
    setBusy(true);
    const res = await sendTeamInvitation({
      teamId: team!.id,
      senderId: "me",
      recipientId: student!.id,
      message: message.trim() || undefined,
      match,
    });
    setBusy(false);
    if (!res.ok) {
      error("Couldn't send the invitation", REQUEST_ERROR_MESSAGES[res.error]);
      return;
    }
    success("Invitation sent", `${student!.fullName} has been invited to join ${team!.projectTitle}.`);
    setMessage("");
    onSent(student!.id);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Invite ${student.fullName}`}
      description={`Invite ${student.fullName} to join ${team.projectTitle}.`}
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button loading={busy} disabled={full} onClick={handleSend}>
            <UserPlus className="h-4 w-4" /> Send Invitation
          </Button>
        </>
      }
    >
      <dl className="rounded-xl bg-slate-50 px-4 py-3 text-sm ring-1 ring-inset ring-slate-100">
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">Team</dt>
          <dd className="font-medium text-slate-800">
            {team.members.length} / {team.maxMembers} members
          </dd>
        </div>
        {gapSkills.length > 0 && (
          <div className="mt-1.5 flex justify-between gap-2">
            <dt className="shrink-0 text-slate-500">Helps cover</dt>
            <dd className="text-right font-medium text-slate-800">
              {gapSkills.slice(0, 3).join(", ")}
            </dd>
          </div>
        )}
      </dl>
      {full ? (
        <p role="alert" className="mt-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
          Your team is already full — no new invitation can be sent.
        </p>
      ) : (
        <div className="mt-3">
          <Textarea
            label="Optional message"
            name="invite-message"
            placeholder={`Hi ${student.fullName.split(" ")[0]}, we'd like you to join our project team.`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
          <p className="mt-1 text-xs text-slate-400">
            {openPositions(team)} position{openPositions(team) === 1 ? "" : "s"} available.
          </p>
        </div>
      )}
    </Modal>
  );
}
