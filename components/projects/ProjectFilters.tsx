"use client";

import { FilterChips, FilterSelect } from "@/components/ui/Filters";
import { Button } from "@/components/ui/Button";
import { PROGRAM_OPTIONS, PROJECT_CATEGORY_OPTIONS, PROJECT_STATUS_OPTIONS, SKILL_CATALOGUE } from "@/types";
import type { ProjectFilters } from "@/lib/services/projects";

const TEAM_SIZE_OPTIONS = [
  { value: "2-3", label: "2–3 members" },
  { value: "4-5", label: "4–5 members" },
  { value: "6+", label: "6+ members" },
];

const DEADLINE_OPTIONS = [
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "next-month", label: "Next month" },
  { value: "later", label: "Later" },
];

const SORT_OPTIONS = [
  { value: "match", label: "Best match" },
  { value: "deadline", label: "Earliest deadline" },
  { value: "newest", label: "Newest" },
];

export function activeFilterCount(f: ProjectFilters): number {
  return (
    (f.category ? 1 : 0) +
    f.skills.length +
    (f.program ? 1 : 0) +
    (f.status ? 1 : 0) +
    (f.teamSize ? 1 : 0) +
    (f.deadline ? 1 : 0)
  );
}

export function ProjectFilters({
  filters,
  onChange,
  onClear,
}: {
  filters: ProjectFilters;
  onChange: (next: ProjectFilters) => void;
  onClear: () => void;
}) {
  const count = activeFilterCount(filters);

  function toggleSkill(skill: string) {
    onChange({
      ...filters,
      skills: filters.skills.includes(skill)
        ? filters.skills.filter((s) => s !== skill)
        : [...filters.skills, skill],
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FilterSelect
          label="Category"
          value={filters.category}
          onChange={(category) => onChange({ ...filters, category })}
          options={PROJECT_CATEGORY_OPTIONS}
        />
        <FilterSelect
          label="Program"
          value={filters.program}
          onChange={(program) => onChange({ ...filters, program })}
          options={PROGRAM_OPTIONS}
        />
        <FilterSelect
          label="Team status"
          value={filters.status}
          onChange={(status) => onChange({ ...filters, status })}
          options={PROJECT_STATUS_OPTIONS}
        />
        <FilterSelect
          label="Team size"
          value={filters.teamSize}
          onChange={(teamSize) => onChange({ ...filters, teamSize })}
          options={TEAM_SIZE_OPTIONS}
          placeholder="Any size"
        />
        <FilterSelect
          label="Deadline"
          value={filters.deadline}
          onChange={(deadline) => onChange({ ...filters, deadline })}
          options={DEADLINE_OPTIONS}
          placeholder="Anytime"
        />
        <FilterSelect
          label="Sort by"
          value={filters.sort}
          onChange={(sort) => onChange({ ...filters, sort: sort as ProjectFilters["sort"] })}
          options={SORT_OPTIONS}
          placeholder="Best match"
        />
      </div>
      <FilterChips
        label="Required skills"
        options={SKILL_CATALOGUE}
        selected={filters.skills}
        onToggle={toggleSkill}
      />
      {count > 0 && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear Filters ({count})
        </Button>
      )}
    </div>
  );
}
