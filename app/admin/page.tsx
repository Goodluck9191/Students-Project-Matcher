"use client";

import * as React from "react";
import {
  CheckCircle2,
  FolderKanban,
  GraduationCap,
  Inbox,
  Sparkles,
  UserCheck,
  Users,
  UsersRound,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState } from "@/components/ui/States";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { HBarChart, WeekdayChart } from "@/components/admin/AdminChart";
import { AdminQuickActions, AdminRecentActivity } from "@/components/admin/AdminPanels";
import { AdminLoadingState } from "@/components/admin/AdminStates";
import {
  getAdminStats,
  getProgramStats,
  getProjectStatusStats,
  getRecentActivity,
  getTeamStatusStats,
  getWeekdayActivity,
  type AdminActivityItem,
  type AdminStats,
  type StatusSlice,
  type WeekdaySlice,
} from "@/lib/services/admin";

export default function AdminDashboardPage() {
  const [data, setData] = React.useState<{
    stats: AdminStats;
    projects: StatusSlice[];
    teams: StatusSlice[];
    programs: StatusSlice[];
    week: WeekdaySlice[];
    activity: AdminActivityItem[];
  } | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([
      getAdminStats(),
      getProjectStatusStats(),
      getTeamStatusStats(),
      getProgramStats(),
      getWeekdayActivity(),
      getRecentActivity(8),
    ])
      .then(([stats, projects, teams, programs, week, activity]) => {
        if (!cancelled) setData({ stats, projects, teams, programs, week, activity });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <div className="space-y-6">
        <PageHeader title="Admin Dashboard" subtitle="Monitor and manage the Project Matcher platform." />
        <ErrorState
          title="Couldn't load admin data"
          description="Something went wrong. Please try again."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (!data) return <AdminLoadingState />;

  const { stats } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Monitor and manage the Project Matcher platform."
      />
      <p className="text-xs text-slate-400">
        Demo figures calculated live from the same mock state students see.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" role="list" aria-label="Platform statistics">
        <AdminStatCard icon={Users} label="Total Students" value={stats.totalStudents} hint={`${stats.activeStudents} active`} href="/admin/users" accent="bg-brand-50 text-brand-600" />
        <AdminStatCard icon={UserCheck} label="Active Students" value={stats.activeStudents} hint="Completion ≥ 70%" href="/admin/users" accent="bg-emerald-50 text-emerald-700" />
        <AdminStatCard icon={FolderKanban} label="Total Projects" value={stats.totalProjects} hint={`${stats.activeProjects} active`} href="/admin/projects" accent="bg-cyan-50 text-cyan-700" />
        <AdminStatCard icon={GraduationCap} label="Active Projects" value={stats.activeProjects} hint="Recruiting / In Progress" href="/admin/projects" accent="bg-violet-50 text-violet-700" />
        <AdminStatCard icon={UsersRound} label="Total Teams" value={stats.totalTeams} hint={`${stats.completedTeams} completed`} href="/admin/teams" accent="bg-amber-50 text-amber-700" />
        <AdminStatCard icon={CheckCircle2} label="Completed Teams" value={stats.completedTeams} hint="Work delivered" href="/admin/teams" accent="bg-emerald-50 text-emerald-700" />
        <AdminStatCard icon={Inbox} label="Pending Requests" value={stats.pendingRequests} hint="Awaiting response" href="/requests" accent="bg-rose-50 text-rose-700" />
        <AdminStatCard icon={Sparkles} label="Successful Matches" value={stats.successfulMatches} hint="Accepted invitations" href="/admin/reports" accent="bg-teal-50 text-teal-700" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <HBarChart title="Projects by Status" subtitle="Across the platform" data={data.projects} />
        <HBarChart title="Teams by Status" subtitle="Across the platform" data={data.teams} barClassName="bg-emerald-500" />
        <HBarChart title="Students by Academic Program" subtitle="Top programs" data={data.programs.slice(0, 6)} barClassName="bg-cyan-500" />
        <WeekdayChart title="Matching Activity" subtitle="Requests created per weekday" data={data.week} />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <AdminRecentActivity items={data.activity} />
        <AdminQuickActions />
      </div>
    </div>
  );
}
