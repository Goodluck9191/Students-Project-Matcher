"use client";

import Link from "next/link";
import { Eye, UserMinus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { TeamStatus } from "@/components/teams/TeamStatus";
import { formatDate } from "@/lib/utils";
import type { ProjectStatus, Team } from "@/types";

export function AdminTeamTable({
  teams,
  categoryByProject,
  ownerNameById,
  onStatusChange,
  onDisband,
}: {
  teams: Team[];
  categoryByProject: Map<string, string>;
  ownerNameById: Map<string, string>;
  onStatusChange: (team: Team, status: ProjectStatus) => void;
  onDisband: (team: Team) => void;
}) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[var(--shadow-card)] md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
              <th scope="col" className="px-4 py-3 font-semibold">Team</th>
              <th scope="col" className="px-4 py-3 font-semibold">Owner</th>
              <th scope="col" className="px-4 py-3 font-semibold">Members</th>
              <th scope="col" className="px-4 py-3 font-semibold">Progress</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {teams.map((t) => (
              <tr key={t.id} className="align-top transition-colors hover:bg-slate-50/60">
                <td className="max-w-64 px-4 py-3">
                  <Link href={`/teams/${t.id}`} className="block truncate font-medium text-slate-900 hover:text-brand-700 hover:underline">
                    {t.projectTitle}
                  </Link>
                  <span className="text-xs text-slate-500">
                    {categoryByProject.get(t.projectId) ?? "Project"} · {formatDate(t.createdAt)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-slate-600">
                    <Avatar name={ownerNameById.get(t.ownerId) ?? "?"} size="xs" />
                    {ownerNameById.get(t.ownerId) ?? t.ownerId}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-600">
                  {t.members.length}/{t.maxMembers}
                </td>
                <td className="px-4 py-3">
                  <span className="flex w-28 items-center gap-2">
                    <Progress value={t.progress} ariaLabel={`${t.projectTitle} progress`} />
                    <span className="text-xs tabular-nums text-slate-500">{t.progress}%</span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <label className="sr-only" htmlFor={`tstatus-${t.id}`}>Status for {t.projectTitle}</label>
                  <select
                    id={`tstatus-${t.id}`}
                    value={t.status}
                    onChange={(e) => onStatusChange(t, e.target.value as ProjectStatus)}
                    className="h-8 rounded-lg border border-slate-300 bg-white px-1.5 text-[13px] font-medium focus:border-brand-500 focus:outline-none"
                  >
                    {(["Recruiting", "Team Complete", "In Progress", "Completed"] as const).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <span className="inline-flex gap-1.5">
                    <Button href={`/teams/${t.id}`} variant="ghost" size="sm" aria-label={`View ${t.projectTitle}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDisband(t)}
                      aria-label={`Disband ${t.projectTitle}`}
                      className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {teams.map((t) => (
          <li key={t.id}>
            <Card>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/teams/${t.id}`} className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 hover:text-brand-700">
                    {t.projectTitle}
                  </Link>
                </div>
                <div className="mt-1.5">
                  <TeamStatus team={t} />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Owner: {ownerNameById.get(t.ownerId) ?? t.ownerId} · {t.members.length}/{t.maxMembers} members · {t.progress}% · {formatDate(t.createdAt)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1.5 text-[13px] text-slate-600">
                    Status
                    <select
                      value={t.status}
                      onChange={(e) => onStatusChange(t, e.target.value as ProjectStatus)}
                      aria-label={`Status for ${t.projectTitle}`}
                      className="h-8 rounded-lg border border-slate-300 bg-white px-1.5 text-[13px] font-medium"
                    >
                      {(["Recruiting", "Team Complete", "In Progress", "Completed"] as const).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <span className="flex-1" />
                  <Button href={`/teams/${t.id}`} variant="outline" size="sm">View</Button>
                  <Button variant="outline" size="sm" onClick={() => onDisband(t)} className="border-rose-200 text-rose-600">
                    Disband
                  </Button>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
