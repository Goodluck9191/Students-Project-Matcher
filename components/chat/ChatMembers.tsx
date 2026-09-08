import Link from "next/link";
import { Crown } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import type { Student, TeamMember } from "@/types";

/** Deterministic mock presence (presentational only — no real presence). */
export function mockOnline(studentId: string): boolean {
  let hash = 0;
  for (const c of studentId) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return hash % 2 === 0;
}

export function ChatMembers({
  members,
  studentsById,
  ownerId,
  currentUserId,
}: {
  members: TeamMember[];
  studentsById: Map<string, Student>;
  ownerId: string;
  currentUserId: string;
}) {
  return (
    <div>
      <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Team Members · {members.length}
      </h2>
      <ul className="mt-2 space-y-1">
        {members.map((m) => {
          const online = mockOnline(m.studentId);
          return (
            <li key={m.studentId}>
              <Link
                href={`/profile/${m.studentId}`}
                className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50"
              >
                <span className="relative shrink-0">
                  <Avatar name={m.name} size="sm" />
                  <span
                    aria-label={online ? "Online (mock)" : "Offline (mock)"}
                    title={online ? "Online (mock)" : "Offline (mock)"}
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white",
                      online ? "bg-emerald-500" : "bg-slate-300"
                    )}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 truncate text-sm font-medium text-slate-800">
                    <span className="truncate">
                      {m.name}
                      {m.studentId === currentUserId ? " (You)" : ""}
                    </span>
                    {m.studentId === ownerId && (
                      <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-label="Team owner" />
                    )}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {m.role}
                    {studentsById.get(m.studentId)?.program
                      ? ` · ${studentsById.get(m.studentId)?.program}`
                      : ""}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 px-1 text-[11px] text-slate-400">
        Presence is mock data for demonstration.
      </p>
    </div>
  );
}
