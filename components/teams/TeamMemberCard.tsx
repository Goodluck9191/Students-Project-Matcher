import { Crown, Pencil, UserMinus } from "lucide-react";import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { levelOf } from "@/lib/matching/skillMatcher";
import type { SkillWithLevel, TeamMember } from "@/types";

export function TeamMemberCard({
  member,
  skillLevels,
  isOwner,
  isSelf,
  canManage,
  onChangeRole,
  onRemove,
}: {
  member: TeamMember;
  skillLevels?: SkillWithLevel[];
  isOwner: boolean;
  isSelf: boolean;
  canManage: boolean;
  onChangeRole: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
}) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col py-5">
        <div className="flex items-start gap-3">
          <Avatar name={member.name} src={member.avatarUrl} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate font-semibold text-slate-900">
              <span className="truncate">{member.name}</span>
              {isOwner && (
                <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-label="Team owner" />
              )}
            </p>
            <p className="truncate text-[13px] font-medium text-brand-700">{member.role}</p>
            <p className="truncate text-xs text-slate-500">
              {[member.program, member.year ? `Year ${member.year}` : ""].filter(Boolean).join(" • ") || "Student"}
              {isSelf ? " · You" : ""}
            </p>
          </div>
          {member.status === "invited" && <Badge variant="warning">Invited</Badge>}
        </div>

        <ul className="mt-3 space-y-1 text-sm">
          {member.skills.slice(0, 4).map((s) => (
            <li key={s} className="flex items-center justify-between gap-2">
              <span className="truncate text-slate-700">{s}</span>
              <Badge variant="outline" className="shrink-0">
                {levelOf(skillLevels, s)}
              </Badge>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>Match: <span className="font-bold text-slate-800">{member.matchScore}%</span></span>
          <span className="truncate">{member.availability?.slice(0, 2).join(" · ") ?? ""}</span>
        </div>

        <div className="mt-3 flex flex-1 gap-2" />
        <div className="flex flex-col gap-2">
          <Button href={`/profile/${member.studentId}`} variant="outline" size="sm" className="w-full">
            View Profile
          </Button>
          {canManage && !isSelf && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => onChangeRole(member)}>
                <Pencil className="h-3.5 w-3.5" /> Role
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                onClick={() => onRemove(member)}
                aria-label={`Remove ${member.name} from team`}
              >
                <UserMinus className="h-3.5 w-3.5" /> Remove
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function TeamMemberList({
  members,
  levelsByStudent,
  selfId,
  ownerId,
  canManage,
  onChangeRole,
  onRemove,
}: {
  members: TeamMember[];
  levelsByStudent: Map<string, SkillWithLevel[] | undefined>;
  selfId: string;
  ownerId: string;
  canManage: boolean;
  onChangeRole: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {members.map((m) => (
        <li key={m.studentId}>
          <TeamMemberCard
            member={m}
            skillLevels={levelsByStudent.get(m.studentId)}
            isOwner={m.studentId === ownerId}
            isSelf={m.studentId === selfId}
            canManage={canManage}
            onChangeRole={onChangeRole}
            onRemove={onRemove}
          />
        </li>
      ))}
    </ul>
  );
}
