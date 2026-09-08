"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import type { TeamRequest } from "@/types";

/** Compact pending-requests widget with mock accept/reject (local state only). */
export function PendingRequests({
  received,
  sent,
}: {
  received: TeamRequest[];
  sent: TeamRequest[];
}) {
  const { success, info } = useToast();
  const [incoming, setIncoming] = React.useState(received);

  function respond(id: string, accept: boolean) {
    const req = incoming.find((r) => r.id === id);
    setIncoming((prev) => prev.filter((r) => r.id !== id));
    if (req) {
      if (accept) success(`Accepted ${req.studentName}`, `${req.projectTitle} · demo mode, nothing persisted.`);
      else info(`Rejected ${req.studentName}`, "They won't be notified in demo mode.");
    }
  }

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
      {incoming.length === 0 && sent.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No pending requests"
            description="You're all caught up."
          />
        </div>
      ) : (
        <Card className="mt-4">
          <CardContent className="space-y-3 py-4">
            {incoming.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-slate-200 p-3.5"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={r.studentName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {r.studentName}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      wants to join · {r.projectTitle} · {r.match}% match
                    </p>
                  </div>
                </div>
                <div className="mt-2.5 flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => respond(r.id, true)}>
                    Accept
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => respond(r.id, false)}>
                    Reject
                  </Button>
                </div>
              </div>
            ))}
            {sent.filter((r) => r.status === "pending").map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3.5 py-3 ring-1 ring-inset ring-slate-100"
              >
                <Avatar name={r.studentName} size="sm" />
                <p className="min-w-0 flex-1 truncate text-[13px] text-slate-600">
                  You invited <span className="font-semibold">{r.studentName}</span>
                </p>
                <Badge variant="warning">Pending</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </section>
  );
}
