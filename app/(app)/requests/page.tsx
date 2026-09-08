"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Tabs } from "@/components/ui/Tabs";
import { RequestCard } from "@/components/requests/RequestCard";
import {
  enrichRequests,
  getReceivedRequests,
  getSentRequests,
  type EnrichedRequest,
} from "@/lib/services/requests";
import { listProjects, EMPTY_FILTERS } from "@/lib/services/projects";
import { listStudents } from "@/lib/services/students";
import { listTeams } from "@/lib/services/teams";
import { cn } from "@/lib/utils";

const CURRENT_USER = "me";

type RequestView = EnrichedRequest & { dir: "received" | "sent" };

function RequestSection({
  views,
  emptyTitle,
  emptyDescription,
  emptyAction,
  onChanged,
}: {
  views: RequestView[];
  emptyTitle: string;
  emptyDescription: string;
  emptyAction: { label: string; href: string };
  onChanged: () => void;
}) {
  if (views.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyAction.label}
        actionHref={emptyAction.href}
      />
    );
  }
  const pending = views.filter((v) => v.request.status === "pending");
  const history = views.filter((v) => v.request.status !== "pending");
  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {pending.map((v) => (
            <RequestCard key={v.request.id} view={v} onChanged={onChanged} />
          ))}
        </div>
      )}
      {history.length > 0 && (
        <section aria-label="Request history">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            History
          </h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {history.map((v) => (
              <RequestCard key={v.request.id} view={v} onChanged={onChanged} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/** Requests inbox: received / sent tabs with live accept/reject/cancel. */
export default function RequestsPage() {
  const [tab, setTab] = React.useState<"received" | "sent">("received");
  const [views, setViews] = React.useState<RequestView[] | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [nonce, setNonce] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([
      getReceivedRequests(CURRENT_USER),
      getSentRequests(CURRENT_USER),
      listStudents(),
      listProjects(EMPTY_FILTERS),
      listTeams(),
    ])
      .then(([received, sent, students, projects, teams]) => {
        if (cancelled) return;
        const tagged = [
          ...received.map((r) => ({ r, dir: "received" as const })),
          ...sent.map((r) => ({ r, dir: "sent" as const })),
        ];
        const enriched = enrichRequests(
          tagged.map((t) => t.r),
          students,
          projects,
          teams,
          CURRENT_USER
        ).map((v, i) => ({ ...v, dir: tagged[i]?.dir ?? ("received" as const) }));
        setViews(enriched);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const receivedViews = (views ?? []).filter((v) => v.dir === "received");
  const sentViews = (views ?? []).filter((v) => v.dir === "sent");

  return (
    <div>
      <PageHeader
        title="Requests"
        subtitle="Team invitations you received and sent."
        actions={
          <Button href="/matches" variant="outline" size="sm">
            Find Teammates
          </Button>
        }
      />

      <div className="mt-5">
        <Tabs
          tabs={[
            {
              value: "received",
              label: "Received",
              count: views ? receivedViews.filter((v) => v.request.status === "pending").length : undefined,
            },
            {
              value: "sent",
              label: "Sent",
              count: views ? sentViews.filter((v) => v.request.status === "pending").length : undefined,
            },
          ]}
          value={tab}
          onChange={(v) => setTab(v as "received" | "sent")}
        />
      </div>

      <div className={cn("mt-5")}>
        {failed ? (
          <ErrorState
            title="Couldn't load requests"
            description="Something went wrong. Please try again."
            onRetry={() => setNonce((n) => n + 1)}
          />
        ) : !views ? (
          <div className="grid gap-4 md:grid-cols-2" role="status" aria-label="Loading requests">
            {[0, 1].map((i) => (
              <Card key={i}>
                <CardContent className="space-y-3 py-5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tab === "received" ? (
          <RequestSection
            views={receivedViews}
            emptyTitle="No pending invitations"
            emptyDescription="When someone invites you to join a project team, you'll see it here."
            emptyAction={{ label: "Find Projects", href: "/projects" }}
            onChanged={() => setNonce((n) => n + 1)}
          />
        ) : (
          <RequestSection
            views={sentViews}
            emptyTitle="No invitations sent yet"
            emptyDescription="Find a suitable teammate and invite them to your project team."
            emptyAction={{ label: "Find Teammates", href: "/matches" }}
            onChanged={() => setNonce((n) => n + 1)}
          />
        )}
      </div>
      <p className="mt-6 text-center text-xs text-slate-400">
        Handled requests stay in History.{" "}
        <Link href="/teams" className="font-medium text-brand-700 hover:underline">
          View your teams
        </Link>
      </p>
    </div>
  );
}
