"use client";

import Link from "next/link";
import { Check, UserPlus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { MatchScore } from "./MatchScore";
import { MatchingReasons } from "./MatchingReasons";
import { levelOf } from "@/lib/matching/skillMatcher";
import type { MatchRecommendation } from "@/types";

export type InviteState = "idle" | "pending" | "member" | "full";

export function MatchCard({
  rec,
  inviteState,
  onInvite,
}: {
  rec: MatchRecommendation;
  inviteState: InviteState;
  onInvite: (rec: MatchRecommendation) => void;
}) {
  const { student } = rec;

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
        </div>

        <div className="mt-4">
          <MatchScore score={rec.score} tier={rec.tier} />
        </div>

        {rec.matchingSkills.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Matching Skills
            </p>
            <ul className="mt-1.5 space-y-1 text-sm">
              {rec.matchingSkills.slice(0, 4).map((s) => (
                <li key={s} className="flex items-center gap-1.5 text-slate-700">
                  <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                  {s}
                  <span className="text-xs text-slate-400">
                    · {levelOf(student.skillLevels, s)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {rec.missingSkillsCovered.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Fills Team Gaps
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {rec.missingSkillsCovered.map((s) => (
                <Badge key={s} variant="success">
                  + {s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Interests
            </p>
            <p className="mt-1 leading-relaxed text-slate-600">
              {rec.matchingInterests.length > 0
                ? rec.matchingInterests.slice(0, 3).join(" • ")
                : student.interests.slice(0, 3).join(" • ") || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Availability
            </p>
            <p className="mt-1 leading-relaxed text-slate-600">
              {student.availability.join(" • ") || "—"}
            </p>
          </div>
        </div>

        <div className="mt-3">
          <MatchingReasons reasons={rec.reasons} />
        </div>

        <div className="mt-4 flex flex-1 gap-2" />
        <div className="flex gap-2">
          <Button href={`/profile/${student.id}`} variant="outline" size="sm" className="flex-1">
            View Profile
          </Button>
          <InviteStateButton state={inviteState} studentName={student.fullName} onClick={() => onInvite(rec)} />
        </div>
      </CardContent>
    </Card>
  );
}

function InviteStateButton({
  state,
  studentName,
  onClick,
}: {
  state: InviteState;
  studentName: string;
  onClick: () => void;
}) {
  if (state === "member") {
    return (
      <Button size="sm" variant="secondary" disabled className="flex-1" aria-label={`${studentName} is already a team member`}>
        <Check className="h-3.5 w-3.5" /> Team Member
      </Button>
    );
  }
  if (state === "pending") {
    return (
      <Button size="sm" variant="secondary" disabled className="flex-1" aria-label={`Invitation pending for ${studentName}`}>
        <Check className="h-3.5 w-3.5" /> Invitation Pending
      </Button>
    );
  }
  if (state === "full") {
    return (
      <Button size="sm" variant="outline" disabled className="flex-1" aria-label="Team is full">
        Team Full
      </Button>
    );
  }
  return (
    <Button size="sm" className="flex-1" onClick={onClick}>
      <UserPlus className="h-3.5 w-3.5" /> Invite
    </Button>
  );
}
