"use client";

import * as React from "react";
import { ErrorState } from "@/components/ui/States";
import {
  ComplementarySkillsCard,
} from "@/components/dashboard/ComplementarySkillsCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { MyProjects } from "@/components/dashboard/MyProjects";
import { NotificationsPreview } from "@/components/dashboard/NotificationsPreview";
import { OverviewStats } from "@/components/dashboard/OverviewStats";
import { PendingRequests } from "@/components/dashboard/PendingRequests";
import { ProfileCompletionCard } from "@/components/dashboard/ProfileCompletionCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { RecommendedProjects } from "@/components/dashboard/RecommendedProjects";
import { RecommendedTeammates } from "@/components/dashboard/RecommendedTeammates";
import {
  getDashboardData,
  type DashboardData,
} from "@/lib/services/dashboard";

/**
 * Student dashboard — the command center.
 * Data flows: UI → lib/services/dashboard.ts → lib/mock/*.
 */
export default function DashboardPage() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [failed, setFailed] = React.useState(false);

  const load = React.useCallback(() => {
    setFailed(false);
    getDashboardData().then(setData).catch(() => setFailed(true));
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    getDashboardData()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed && !data) {
    return (
      <div className="space-y-6">
        <DashboardHeader firstName="there" />
        <ErrorState
          title="Couldn't load your dashboard"
          description="Something went wrong. Please try again."
          onRetry={load}
        />
      </div>
    );
  }

  if (!data) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 sm:space-y-8">
      <DashboardHeader firstName={data.firstName} />
      <ProfileCompletionCard completion={data.profileCompletion} />
      <OverviewStats stats={data.stats} />

      <RecommendedProjects projects={data.recommendedProjects} />
      <RecommendedTeammates teammates={data.recommendedTeammates} />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="min-w-0 space-y-6 sm:space-y-8 lg:col-span-3">
          <MyProjects projects={data.myProjects} />
          <PendingRequests received={data.pendingReceived} sent={data.pendingSent} />
        </div>
        <div className="min-w-0 space-y-6 sm:space-y-8 lg:col-span-2">
          <ComplementarySkillsCard
            strongest={data.strongestSkills}
            missing={data.missingSkills}
          />
          <RecentActivity items={data.activity} />
          <NotificationsPreview
            notifications={data.notifications}
            unreadCount={data.unreadCount}
          />
        </div>
      </div>
    </div>
  );
}
