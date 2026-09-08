import { Lightbulb, PartyPopper } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import type { TeamSkillGap } from "@/types";

/** Gap summary + recommended next skill, driven by engine-derived gap states. */
export function TeamSkillGaps({ gaps }: { gaps: TeamSkillGap[] }) {
  const missing = gaps.filter((g) => g.status === "missing");
  const partial = gaps.filter((g) => g.status === "partial");

  if (missing.length === 0 && partial.length === 0) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="flex items-start gap-3 py-5">
          <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
          <div>
            <h3 className="font-semibold text-slate-900">Great team balance!</h3>
            <p className="mt-0.5 text-sm text-slate-600">
              Your team currently covers all required project skills.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-5">
        <h3 className="font-semibold text-slate-900">Team Skill Gaps</h3>
        <p className="mt-1 text-sm text-slate-500">
          Your team has strong development coverage, but could benefit from:
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {missing.map((g) => (
            <Badge key={g.skill} variant="error">
              Missing: {g.skill}
            </Badge>
          ))}
          {partial.map((g) => (
            <Badge key={g.skill} variant="warning">
              Partial: {g.skill} ({g.holders} member{g.holders === 1 ? "" : "s"})
            </Badge>
          ))}
        </div>
        {missing.length > 0 && (
          <div className="mt-4 rounded-xl bg-brand-50/70 px-4 py-3 ring-1 ring-inset ring-brand-100">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-800">
              <Lightbulb className="h-4 w-4" aria-hidden /> Recommended next skill: {missing[0].skill}
            </p>
            <p className="mt-1 text-[13px] text-slate-600">
              Adding a member with {missing[0].skill} experience would improve
              the team&apos;s skill balance.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
