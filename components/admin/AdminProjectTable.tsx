"use client";

import Link from "next/link";
import { Eye, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { PROJECT_STATUS_BADGE } from "@/components/projects/ProjectCard";
import { formatDate } from "@/lib/utils";
import type { Project, ProjectStatus } from "@/types";

export function AdminProjectTable({
  projects,
  teamCountByProject,
  onStatusChange,
  onArchive,
  onDelete,
}: {
  projects: Project[];
  teamCountByProject: Map<string, number>;
  onStatusChange: (project: Project, status: ProjectStatus) => void;
  onArchive: (project: Project) => void;
  onDelete: (project: Project) => void;
}) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[var(--shadow-card)] md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
              <th scope="col" className="px-4 py-3 font-semibold">Project</th>
              <th scope="col" className="px-4 py-3 font-semibold">Creator</th>
              <th scope="col" className="px-4 py-3 font-semibold">Team</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 font-semibold">Deadline</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map((p) => (
              <tr key={p.id} className="align-top transition-colors hover:bg-slate-50/60">
                <td className="max-w-64 px-4 py-3">
                  <Link href={`/projects/${p.id}`} className="block truncate font-medium text-slate-900 hover:text-brand-700 hover:underline">
                    {p.title}
                  </Link>
                  <span className="text-xs text-slate-500">{p.category} · {formatDate(p.createdAt)}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{p.creatorName}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {p.currentMembers}/{p.maxTeamSize}
                  {teamCountByProject.has(p.id) ? "" : " · no team"}
                </td>
                <td className="px-4 py-3">
                  <label className="sr-only" htmlFor={`pstatus-${p.id}`}>Status for {p.title}</label>
                  <select
                    id={`pstatus-${p.id}`}
                    value={p.status}
                    onChange={(e) => onStatusChange(p, e.target.value as ProjectStatus)}
                    className="h-8 rounded-lg border border-slate-300 bg-white px-1.5 text-[13px] font-medium focus:border-brand-500 focus:outline-none"
                  >
                    {(["Recruiting", "Team Complete", "In Progress", "Completed", "Archived"] as const).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(p.deadline)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <span className="inline-flex gap-1.5">
                    <Button href={`/projects/${p.id}`} variant="ghost" size="sm" aria-label={`View ${p.title}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {p.status !== "Archived" && (
                      <Button variant="ghost" size="sm" onClick={() => onArchive(p)}>
                        Archive
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(p)}
                      aria-label={`Delete ${p.title}`}
                      className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {projects.map((p) => (
          <li key={p.id}>
            <Card>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/projects/${p.id}`} className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 hover:text-brand-700">
                    {p.title}
                  </Link>
                  <Badge variant={PROJECT_STATUS_BADGE[p.status]}>{p.status}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {p.creatorName} · {p.category} · Team {p.currentMembers}/{p.maxTeamSize}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1.5 text-[13px] text-slate-600">
                    Status
                    <select
                      value={p.status}
                      onChange={(e) => onStatusChange(p, e.target.value as ProjectStatus)}
                      aria-label={`Status for ${p.title}`}
                      className="h-8 rounded-lg border border-slate-300 bg-white px-1.5 text-[13px] font-medium"
                    >
                      {(["Recruiting", "Team Complete", "In Progress", "Completed", "Archived"] as const).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <span className="flex-1" />
                  <Button href={`/projects/${p.id}`} variant="outline" size="sm">View</Button>
                  {p.status !== "Archived" && (
                    <Button variant="outline" size="sm" onClick={() => onArchive(p)}>Archive</Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => onDelete(p)} className="border-rose-200 text-rose-600">
                    Delete
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
