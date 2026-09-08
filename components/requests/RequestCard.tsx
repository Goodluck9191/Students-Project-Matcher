"use client";

import * as React from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { RequestStatus } from "./RequestStatus";
import {
  REQUEST_ERROR_MESSAGES,
  acceptRequest,
  cancelRequest,
  rejectRequest,
  type EnrichedRequest,
} from "@/lib/services/requests";
import { timeAgo } from "@/lib/utils";

const CURRENT_USER = "me";

function ConfirmModal({
  title,
  description,
  confirmLabel,
  open,
  busy,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={confirmLabel === "Cancel Invitation" ? "outline" : "danger"} loading={busy} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">
        {confirmLabel === "Cancel Invitation"
          ? "The recipient will no longer see this invitation."
          : "This cannot be undone in demo mode history."}
      </p>
    </Modal>
  );
}

/**
 * Action buttons for a request, gated by role:
 * recipient → Accept/Reject (pending only); sender → Cancel (pending only).
 */
export function RequestActions({
  view,
  onChanged,
}: {
  view: EnrichedRequest;
  onChanged: () => void;
}) {
  const { success, error } = useToast();
  const [confirm, setConfirm] = React.useState<"reject" | "cancel" | null>(null);
  const [busy, setBusy] = React.useState(false);
  const { request } = view;

  const isRecipient = request.recipientId === CURRENT_USER;
  const isSender = request.senderId === CURRENT_USER;
  if (request.status !== "pending") return null;

  async function run(action: "accept" | "reject" | "cancel") {
    setBusy(true);
    const res =
      action === "accept"
        ? await acceptRequest(request.id, CURRENT_USER)
        : action === "reject"
          ? await rejectRequest(request.id, CURRENT_USER)
          : await cancelRequest(request.id, CURRENT_USER);
    setBusy(false);
    setConfirm(null);
    if (!res.ok) {
      error("Action failed", REQUEST_ERROR_MESSAGES[res.error]);
      return;
    }
    if (action === "accept") {
      success("You're now a member of the team!", view.teamTitle);
    } else if (action === "reject") {
      success("Invitation declined", "The sender has been notified.");
    } else {
      success("Invitation cancelled", "It no longer appears as pending.");
    }
    onChanged();
  }

  return (
    <div className="flex gap-2">
      {isRecipient && (
        <>
          <Button size="sm" className="flex-1" loading={busy} onClick={() => run("accept")}>
            {request.type === "invitation" ? "Accept Invitation" : "Approve Request"}
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => setConfirm("reject")}>
            {request.type === "invitation" ? "Reject" : "Decline"}
          </Button>
        </>
      )}
      {isSender && !isRecipient && (
        <Button size="sm" variant="outline" className="flex-1" onClick={() => setConfirm("cancel")}>
          Cancel Invitation
        </Button>
      )}
      <ConfirmModal
        title={confirm === "reject" ? "Decline this request?" : "Cancel this invitation?"}
        description={
          confirm === "reject"
            ? "You won't join this project team."
            : "The recipient will no longer see this invitation."
        }
        confirmLabel={confirm === "reject" ? "Decline Invitation" : "Cancel Invitation"}
        open={confirm !== null}
        busy={busy}
        onClose={() => setConfirm(null)}
        onConfirm={() => run(confirm === "reject" ? "reject" : "cancel")}
      />
    </div>
  );
}

export function RequestCard({
  view,
  onChanged,
}: {
  view: EnrichedRequest;
  onChanged: () => void;
}) {
  const { request, counterpart, projectTitle, teamCount } = view;
  const incoming = request.recipientId === CURRENT_USER;

  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              {request.type === "invitation" ? "Team Invitation" : "Join Request"}
            </p>
            <h3 className="mt-1 truncate font-semibold text-slate-900">
              <Link href={`/projects/${request.projectId}`} className="hover:text-brand-700 hover:underline">
                {projectTitle}
              </Link>
            </h3>
          </div>
          <RequestStatus status={request.status} />
        </div>

        <div className="mt-3 flex items-center gap-2.5">
          <Avatar name={counterpart?.fullName ?? "Student"} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">
              {incoming
                ? `Invited by ${counterpart?.fullName ?? "a student"}`
                : `To ${counterpart?.fullName ?? "a student"}`}
            </p>
            <p className="truncate text-xs text-slate-500">
              {[counterpart?.program, counterpart?.year ? `Year ${counterpart.year}` : ""]
                .filter(Boolean)
                .join(" • ")}
              {request.match ? ` · Match: ${request.match}%` : ""}
              {teamCount ? ` · Team ${teamCount}` : ""}
            </p>
          </div>
        </div>

        {request.message && (
          <blockquote className="mt-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm italic leading-relaxed text-slate-600 ring-1 ring-inset ring-slate-100">
            “{request.message}”
          </blockquote>
        )}

        <p className="mt-2.5 text-xs text-slate-400">
          {timeAgo(request.createdAt)}
          {request.respondedAt ? ` · Responded ${timeAgo(request.respondedAt)}` : ""}
        </p>

        <div className="mt-3">
          <RequestActions view={view} onChanged={onChanged} />
        </div>

        {request.status === "accepted" && (
          <div className="mt-3">
            <Button href={`/teams/${request.teamId}`} variant="outline" size="sm" className="w-full">
              View Team
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
