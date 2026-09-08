"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, UserPlus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { EmptyState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { getMatchTier, tierStyles } from "@/lib/matching/score";
import type { MatchRecommendation } from "@/types";

/**
 * Dashboard teammate card — explains WHY the student is recommended
 * (complementary coverage), not just a score. The full matching UI
 * (MatchCard / MatchScore / MatchingReason) lands in Stage 6.
 */
function TeammateCard({ rec }: { rec: MatchRecommendation }) {
  const { success } = useToast();
  const [invited, setInvited] = React.useState(false);
  const tier = tierStyles(getMatchTier(rec.score));
  const { student } = rec;

  function handleInvite() {
    setInvited(true);
    success(`Invited ${student.fullName}`, "They'll see your request in demo mode.");
  }

  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col py-5">
        <div className="flex items-start gap-3">
          <Avatar name={student.fullName} size="lg" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-slate-900">
              <Link href={`/profile/${student.id}`} className="hover:text-brand-700 hover:underline">
                {student.fullName}
              </Link>
            </h3>
            <p className="truncate text-xs text-slate-500">
              {student.program} · Year {student.year}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${tier.classes}`}
            title={tier.label}
          >
            {rec.score}%
          </span>
        </div>

        <div className="mt-3">
          <Progress value={rec.score} ariaLabel={`Match score ${rec.score} percent`} />
        </div>

        <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-[13px] ring-1 ring-inset ring-slate-100">
          <p className="font-semibold text-slate-700">Why this is a good match</p>
          <ul className="mt-1.5 space-y-1">
            {rec.reasons.slice(0, 3).map((r) => (
              <li key={r} className="flex items-start gap-1.5 text-slate-600">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {student.skills.slice(0, 3).map((s) => (
            <Badge key={s} variant="primary">
              {s}
            </Badge>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Available: {student.availability.join(" · ")}
        </p>

        <div className="mt-4 flex flex-1 gap-2" />
        <div className="flex gap-2">
          <Button href={`/profile/${student.id}`} variant="outline" size="sm" className="flex-1">
            View Profile
          </Button>
          <Button
            size="sm"
            className="flex-1"
            disabled={invited}
            onClick={handleInvite}
          >
            {invited ? (
              <>
                <Check className="h-3.5 w-3.5" /> Invited
              </>
            ) : (
              <>
                <UserPlus className="h-3.5 w-3.5" /> Invite
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function RecommendedTeammates({ teammates }: { teammates: MatchRecommendation[] }) {
  return (
    <section aria-labelledby="rec-teammates">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 id="rec-teammates" className="text-lg font-bold text-slate-900">
            Recommended Teammates
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Students who could complement your skills.
          </p>
        </div>
        <Link
          href="/matches"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
        >
          View All <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      {teammates.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No recommendations yet"
            description="Complete your profile to receive better matches."
            actionLabel="Complete Profile"
            actionHref="/profile/setup"
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teammates.map((rec) => (
            <TeammateCard key={rec.student.id} rec={rec} />
          ))}
        </div>
      )}
    </section>
  );
}
