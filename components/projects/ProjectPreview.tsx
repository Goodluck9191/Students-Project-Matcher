import { CalendarDays, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import type { ProjectFormValues } from "@/lib/services/projects";

/** Read-only review of the project form before submission. */
export function ProjectPreview({ values }: { values: ProjectFormValues }) {
  const deadline = values.deadline
    ? formatDate(new Date(`${values.deadline}T12:00:00`))
    : "—";
  return (
    <Card className="border-brand-200 bg-brand-50/40">
      <CardContent className="py-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          Project Preview
        </p>
        <h3 className="mt-1 font-semibold text-slate-900">
          {values.title || "Untitled project"}
        </h3>
        <p className="mt-1 line-clamp-3 text-sm text-slate-600">
          {values.description || "No description yet."}
        </p>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-slate-500">Category:</dt>
            <dd className="font-medium text-slate-800">{values.category || "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-slate-500">Type:</dt>
            <dd className="font-medium text-slate-800">{values.projectType}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-slate-500">Program:</dt>
            <dd className="font-medium text-slate-800">
              {values.program || "—"}
              {values.year ? ` · Year ${values.year}` : ""}
            </dd>
          </div>
        </dl>
        <div className="mt-3">
          <p className="text-xs font-medium text-slate-500">Required Skills:</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {values.requiredSkills.length === 0 && (
              <span className="text-sm text-slate-400">None selected</span>
            )}
            {values.requiredSkills.map((s) => (
              <Badge key={s} variant="outline">
                {s}
              </Badge>
            ))}
          </div>
        </div>
        <div className="mt-3">
          <p className="text-xs font-medium text-slate-500">Interests:</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {values.interests.length === 0 && (
              <span className="text-sm text-slate-400">None selected</span>
            )}
            {values.interests.map((s) => (
              <Badge key={s} variant="info">
                {s}
              </Badge>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <UsersRound className="h-3.5 w-3.5" aria-hidden />
            Team: 0 / {values.maxTeamSize || "—"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            Deadline: {deadline}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
