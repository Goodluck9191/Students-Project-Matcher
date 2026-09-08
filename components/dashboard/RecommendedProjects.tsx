import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/ui/States";
import { ProjectCard } from "@/components/projects/ProjectCard";
import type { Project } from "@/types";

export function RecommendedProjects({ projects }: { projects: Project[] }) {
  return (
    <section aria-labelledby="rec-projects">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 id="rec-projects" className="text-lg font-bold text-slate-900">
            Recommended Projects
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Projects that match your skills and interests.
          </p>
        </div>
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
            title="No recommendations yet"
            description="Complete your profile to receive better matches."
            actionLabel="Complete Profile"
            actionHref="/profile/setup"
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </section>
  );
}
