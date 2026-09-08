"use client";

import Link from "next/link";
import { ArrowRight, LogOut, MessageCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useChatUnread } from "@/components/chat/useChatUnread";
import type { Team } from "@/types";

/** Contextual actions: owners manage, members view/leave. */
export function TeamActions({
  team,
  isOwner,
  canLeave,
  onLeave,
}: {
  team: Team;
  isOwner: boolean;
  canLeave: boolean;
  onLeave: () => void;
}) {
  const unread = useChatUnread(team.id);
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 py-5">
        <h3 className="font-semibold text-slate-900">Team Actions</h3>
        <Button href={`/teams/${team.id}/chat`} className="w-full">
          <MessageCircle className="h-4 w-4" /> Team Chat
          {unread > 0 && (
            <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[11px] font-bold" aria-label={`${unread} unread messages`}>
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
        <Button href={`/projects/${team.projectId}`} variant="outline" className="w-full">
          View Project
        </Button>
        {isOwner ? (
          <>
            <Button href={`/projects/${team.projectId}/edit`} variant="outline" className="w-full">
              <Pencil className="h-4 w-4" /> Edit Project
            </Button>
            <Link
              href="/matches"
              className="inline-flex items-center justify-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
            >
              Find Teammates <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </>
        ) : canLeave ? (
          <Button
            variant="outline"
            className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            onClick={onLeave}
          >
            <LogOut className="h-4 w-4" /> Leave Team
          </Button>
        ) : (
          <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-500">
            Team owners can&apos;t leave without transferring ownership first —
            ownership transfer arrives in a later stage.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
