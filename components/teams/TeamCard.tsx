import Link from "next/link";
import { ArrowRight, CalendarDays, Crown, MessageCircle, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { TeamStatus } from "./TeamStatus";
import { getUnreadMessageCount } from "@/lib/services/chat";
import { openPositions } from "@/lib/services/teams";
import { formatDate } from "@/lib/utils";
import type { Team } from "@/types";

export function TeamCard({
  team,
  category,
  ownerName,
}: {
  team: Team;
  category: string;
  ownerName: string;
}) {
  const open = openPositions(team);
  const unread = getUnreadMessageCount(team.id, "me");
  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col py-5">
        <span className="truncate text-xs font-semibold uppercase tracking-wide text-brand-600">
          {category}
        </span>
        <h3 className="mt-1.5 truncate font-semibold text-slate-900">
          <Link href={`/teams/${team.id}`} className="hover:text-brand-700 hover:underline">
            {team.projectTitle}
          </Link>
        </h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
          <Crown className="h-3 w-3" aria-hidden /> Owner: {ownerName}
        </p>

        <div className="mt-3">
          <TeamStatus team={team} />
        </div>

        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs">
            <span className="font-medium text-slate-600">Project progress</span>
            <span className="text-slate-500">{team.progress}%</span>
          </div>
          <Progress value={team.progress} ariaLabel={`${team.projectTitle} progress ${team.progress} percent`} />
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <UsersRound className="h-3.5 w-3.5" aria-hidden />
            {team.members.length} / {team.maxMembers} members
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            {formatDate(team.deadline)}
          </span>
        </div>

        <div className="mt-3">
          <p className="text-xs font-medium text-slate-500">Skills covered</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {team.skillsCovered.slice(0, 4).map((s) => (
              <Badge key={s} variant="outline">
                {s}
              </Badge>
            ))}
          </div>
        </div>

        <p className="mt-3 text-[13px] font-medium text-slate-600">
          {open === 0 ? "Team Complete" : `${open} position${open === 1 ? "" : "s"} available`}
        </p>

        <div className="mt-3 flex-1" />
        <div className="flex gap-2">
          <Button href={`/teams/${team.id}`} variant="outline" size="sm" className="flex-1">
            View Team <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <Button href={`/teams/${team.id}/chat`} variant="outline" size="sm" className="flex-1" aria-label={unread > 0 ? `Open team chat, ${unread} unread` : "Open team chat"}>
            <MessageCircle className="h-3.5 w-3.5" /> Chat
            {unread > 0 && (
              <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
