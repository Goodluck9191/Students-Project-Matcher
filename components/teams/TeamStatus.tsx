import { Badge } from "@/components/ui/Badge";
import { PROJECT_STATUS_BADGE } from "@/components/projects/ProjectCard";
import { teamStatusLabel } from "@/lib/services/teams";
import type { Team } from "@/types";

/** Status pill + human-readable meaning (color never the only signal). */
export function TeamStatus({ team }: { team: Team }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Badge variant={PROJECT_STATUS_BADGE[team.status]}>{team.status}</Badge>
      <span className="text-xs text-slate-500">{teamStatusLabel(team)}</span>
    </span>
  );
}
