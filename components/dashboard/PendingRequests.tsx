"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { RequestActions } from "@/components/requests/RequestCard";
import {
  enrichRequests,
  getReceivedRequests,
  getSentRequests,
  type EnrichedRequest,
} from "@/lib/services/requests";
import { EMPTY_FILTERS, listProjects } from "@/lib/services/projects";
import { listStudents } from "@/lib/services/students";
import { listTeams } from "@/lib/services/teams";
import { getSessionIdentity } from "@/lib/services/session";

/**
 * Compact pending-requests widget wired to the live request service —
 * accepting here updates teams, capacity, activity, and notifications,
 * exactly like the full /requests page.
 */
export function PendingRequests() {
  const [views, setViews] = React.useState<EnrichedRequest[] | null>(null);
  const [myId, setMyId] = React.useState("me");
  const [nonce, setNonce] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const identity = await getSessionIdentity();
      const [received, sent, students, projects, teams] = await Promise.all([
        getReceivedRequests(identity.id),
        getSentRequests(identity.id),
        listStudents(),
        listProjects(EMPTY_FILTERS),
        listTeams(),
      ]);
      if (cancelled) return;
      setMyId(identity.id);
      const pending = [
        ...received.filter((r) => r.status === "pending"),
        ...sent.filter((r) => r.status === "pending"),
      ];
      setViews(enrichRequests(pending, students, projects, teams, identity.id));
    })();
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const incoming = (views ?? []).filter((v) => v.request.recipientId === myId);
  const outgoing = (views ?? []).filter((v) => v.request.senderId === myId);

  return (
    <section aria-labelledby="pending-requests" className="min-w-0">
      <div className="flex items-end justify-between gap-3">
        <h2 id="pending-requests" className="text-lg font-bold text-slate-900">
          Pending Requests
        </h2>
        <Link
          href="/requests"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
        >
          View All <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      {views !== null && incoming.length === 0 && outgoing.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No pending requests"
            description="You're all caught up."
          />
        </div>
      ) : (
        <Card className="mt-4">
          <CardContent className="space-y-3 py-4">
            {incoming.slice(0, 2).map((v) => (
              <div key={v.request.id} className="rounded-xl border border-slate-200 p-3.5">
                <div className="flex items-center gap-2.5">
                  <Avatar name={v.counterpart?.fullName ?? "Student"} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {v.counterpart?.fullName ?? "A student"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {v.request.type === "invitation" ? "invited you to join" : "wants to join"} · {v.projectTitle}
                      {v.request.match ? ` · ${v.request.match}% match` : ""}
                    </p>
                  </div>
                </div>
                <div className="mt-2.5">
                  <RequestActions view={v} viewerId={myId} onChanged={() => setNonce((n) => n + 1)} />
                </div>
              </div>
            ))}
            {outgoing.slice(0, 3).map((v) => (
              <div
                key={v.request.id}
                className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3.5 py-3 ring-1 ring-inset ring-slate-100"
              >
                <Avatar name={v.counterpart?.fullName ?? "Student"} size="sm" />
                <p className="min-w-0 flex-1 truncate text-[13px] text-slate-600">
                  You invited <span className="font-semibold">{v.counterpart?.fullName ?? "a student"}</span>
                </p>
                <Badge variant="warning">Pending</Badge>
              </div>
            ))}
            {(incoming.length > 2 || outgoing.length > 3) && (
              <Link href="/requests" className="block text-center text-[13px] font-medium text-brand-700 hover:underline">
                See all pending requests
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </section>
  );
}
