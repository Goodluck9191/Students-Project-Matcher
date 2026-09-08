import { CircleAlert, CircleCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import type { TeamSkillState } from "@/lib/matching/teamBalancer";

export function SkillGapSummary({ team }: { team: TeamSkillState }) {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-semibold text-slate-900">Team gaps</h2>
          <span className="text-xs text-slate-500">
            Current Team: {team.memberCount} / {team.maxMembers}
          </span>
        </div>
        {team.covered.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Skills already covered
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {team.covered.map((s) => (
                <Badge key={s} variant="success" className="gap-1">
                  <CircleCheck className="h-3 w-3" aria-hidden /> {s}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Skills needed
          </p>
          {team.missing.length === 0 ? (
            <p className="mt-1 text-sm text-emerald-700">
              All required skills are covered — great balance.
            </p>
          ) : (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {team.missing.map((s) => (
                <Badge key={s} variant="warning" className="gap-1">
                  <CircleAlert className="h-3 w-3" aria-hidden /> {s}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
