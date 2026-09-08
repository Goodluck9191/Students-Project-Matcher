import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { EmptyState } from "@/components/ui/States";
import { formatDate } from "@/lib/utils";
import type { MyProject } from "@/lib/services/dashboard";

const STATUS_VARIANT: Record<MyProject["status"], "primary" | "success" | "info" | "default" | "warning"> = {
  Recruiting: "warning",
  "Team Complete": "success",
  "In Progress": "info",
  "Completed": "default",
  "Archived": "default",
};

export function MyProjects({ projects }: { projects: MyProject[] }) {
  return (
    <section aria-labelledby="my-projects" className="min-w-0">
      <div className="flex items-end justify-between gap-3">
        <h2 id="my-projects" className="text-lg font-bold text-slate-900">
          My Projects
        </h2>
        <Link
          href="/projects"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
        >
          View All <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      {projects.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No projects yet"
            description="Create your first project and start building your team."
            actionLabel="Create Project"
            actionHref="/projects/create"
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {projects.map((p) => (
            <li key={p.id}>
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/projects/${p.projectId}`}
                      className="truncate font-semibold text-slate-900 hover:text-brand-700 hover:underline"
                    >
                      {p.projectTitle}
                    </Link>
                    <Badge variant={STATUS_VARIANT[p.status]} className="shrink-0">
                      {p.status}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">Role: {p.role}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {p.members.slice(0, 4).map((m) => (
                        <Avatar key={m.studentId} name={m.name} size="xs" className="ring-2 ring-white" />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500">
                      {p.members.length}/{p.maxMembers} members
                    </span>
                    <span className="ml-auto text-xs text-slate-500">
                      Due {formatDate(p.deadline)}
                    </span>
                  </div>
                  <div className="mt-2.5">
                    <Progress value={p.progress} ariaLabel={`${p.projectTitle} progress ${p.progress} percent`} />
                  </div>
                  <div className="mt-3">
                    <Button href={`/projects/${p.projectId}`} variant="outline" size="sm" className="w-full">
                      Manage Project
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
