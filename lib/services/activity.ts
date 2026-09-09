import type { ActivityItem, Project, Student, Team, TeamActivityItem, TeamRequest } from "@/types";

/**
 * Deterministic activity feed built ONLY from real records — requests,
 * team system events, and created projects. No fabricated events; newest
 * first by the record's own timestamp. Empty input → empty feed
 * (callers render "No recent activity yet.").
 */
export function getUserActivityFeed(args: {
  userId: string;
  students: Student[];
  projects: Project[];
  teams: Team[];
  requests: TeamRequest[];
  teamActivity: TeamActivityItem[];
  limit?: number;
}): ActivityItem[] {
  const { userId, students, projects, teams, requests, teamActivity, limit = 5 } = args;
  const names = new Map(students.map((s) => [s.id, s.fullName]));
  const projectTitles = new Map(projects.map((p) => [p.id, p.title]));
  const myTeamIds = new Set(teams.filter((t) => t.members.some((m) => m.studentId === userId)).map((t) => t.id));
  const items: ActivityItem[] = [];

  for (const r of requests) {
    const involved = r.senderId === userId || r.recipientId === userId;
    if (!involved) continue;
    const project = projectTitles.get(r.projectId) ?? "a project";
    const other = names.get(r.senderId === userId ? r.recipientId : r.senderId) ?? "A student";
    const at = r.respondedAt ?? r.createdAt;
    if (r.senderId === userId) {
      const action = r.type === "invitation" ? `You invited ${other}` : `You requested to join ${project}`;
      const outcome =
        r.status === "accepted" ? " — accepted" : r.status === "rejected" ? " — declined" : r.status === "cancelled" ? " — cancelled" : "";
      items.push({
        id: `act-req-${r.id}`,
        title: `${action}${r.type === "invitation" ? ` to ${project}` : ""}${outcome}`,
        detail: `Status: ${r.status}`,
        createdAt: at,
        linkHref: "/requests",
      });
    } else {
      const action = r.type === "invitation" ? `${other} invited you to ${project}` : `${other} requested to join ${project}`;
      const outcome =
        r.status === "accepted" ? " — you accepted" : r.status === "rejected" ? " — you declined" : "";
      items.push({
        id: `act-req-${r.id}`,
        title: `${action}${outcome}`,
        detail: `Status: ${r.status}`,
        createdAt: at,
        linkHref: "/requests",
      });
    }
  }

  for (const a of teamActivity) {
    if (!myTeamIds.has(a.teamId)) continue;
    items.push({
      id: `act-team-${a.id}`,
      title: a.title,
      detail: a.detail,
      createdAt: a.createdAt,
      linkHref: `/teams/${a.teamId}`,
    });
  }

  for (const p of projects) {
    if (p.creatorId !== userId) continue;
    items.push({
      id: `act-proj-${p.id}`,
      title: `You created “${p.title}”`,
      createdAt: p.createdAt,
      linkHref: `/projects/${p.id}`,
    });
  }

  return items
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
