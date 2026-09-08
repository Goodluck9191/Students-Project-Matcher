"use client";

import * as React from "react";
import { ListFilter, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectFilters, activeFilterCount } from "@/components/projects/ProjectFilters";
import {
  EMPTY_FILTERS,
  listProjects,
  type ProjectFilters as Filters,
} from "@/lib/services/projects";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

/**
 * Project discovery: search + filters + sortable grid over mock data.
 * Data flows: UI → lib/services/projects.ts → lib/mock/projects.ts.
 */
export default function ProjectsPage() {
  const [filters, setFilters] = React.useState<Filters>(EMPTY_FILTERS);
  const [projects, setProjects] = React.useState<Project[] | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  // Debounce the search input so filtering doesn't run per keystroke.
  React.useEffect(() => {
    const id = window.setTimeout(
      () => setFilters((f) => (f.query === query ? f : { ...f, query })),
      250
    );
    return () => window.clearTimeout(id);
  }, [query]);

  React.useEffect(() => {
    let cancelled = false;
    listProjects(filters)
      .then((result) => {
        if (cancelled) return;
        setFailed(false);
        setProjects(result);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const count = activeFilterCount(filters);

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Discover university projects and find opportunities to build the right team."
        actions={
          <Button href="/projects/create">
            <Plus className="h-4 w-4" /> Create Project
          </Button>
        }
      />

      <div className="mt-5 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Filters — sidebar on desktop, collapsible panel on mobile */}
        <div className="lg:hidden">
          <Button
            variant="outline"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className="w-full"
          >
            <ListFilter className="h-4 w-4" />
            {filtersOpen ? "Hide Filters" : "Show Filters"}
            {count > 0 && (
              <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Button>
        </div>
        <aside
          aria-label="Project filters"
          className={cn("lg:block", filtersOpen ? "block" : "hidden")}
        >
          <Card className="lg:sticky lg:top-20">
            <CardContent className="py-5">
              <ProjectFilters
                filters={filters}
                onChange={setFilters}
                onClear={() => {
                  setQuery("");
                  setFilters(EMPTY_FILTERS);
                }}
              />
            </CardContent>
          </Card>
        </aside>

        <div className="min-w-0">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search projects by title, skill, or keyword…"
            ariaLabel="Search projects"
          />
          <p className="mt-2 text-[13px] text-slate-500" aria-live="polite">
            {projects === null
              ? "Searching projects…"
              : `${projects.length} project${projects.length === 1 ? "" : "s"} found`}
          </p>

          <div className="mt-3">
            {failed ? (
              <ErrorState
                title="Couldn't load projects"
                description="Something went wrong. Please try again."
                onRetry={() => setFilters({ ...filters })}
              />
            ) : projects === null ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading projects">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <Card key={i}>
                    <CardContent className="space-y-3 py-5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-2 w-full" />
                      <Skeleton className="h-9 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <EmptyState
                title="No projects found"
                description="Try changing your search or filters."
                actionLabel="Clear Filters"
                onAction={() => {
                  setQuery("");
                  setFilters(EMPTY_FILTERS);
                }}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {projects.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
