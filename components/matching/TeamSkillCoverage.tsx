import { Progress } from "@/components/ui/Progress";
import { Card, CardContent } from "@/components/ui/Card";
import type { TeamSkillState } from "@/lib/matching/teamBalancer";

/** Per-skill team coverage bars — makes gaps (and why recs exist) visible. */
export function TeamSkillCoverage({ team }: { team: TeamSkillState }) {
  return (
    <Card>
      <CardContent className="py-5">
        <h2 className="font-semibold text-slate-900">Team Skill Coverage</h2>
        <ul className="mt-4 space-y-3">
          {team.coverageBySkill.map(({ skill, coverage }) => {
            const pct = Math.round(coverage * 100);
            const gap = pct < 100;
            return (
              <li key={skill}>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span className="font-medium text-slate-700">{skill}</span>
                  <span className={gap ? "font-semibold text-amber-700" : "text-slate-500"}>
                    {pct}%{gap ? " · gap" : ""}
                  </span>
                </div>
                <Progress
                  value={pct}
                  barClassName={gap ? "bg-amber-500" : undefined}
                  ariaLabel={`${skill} coverage ${pct} percent`}
                />
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
