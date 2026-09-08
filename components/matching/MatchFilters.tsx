"use client";

import { FilterSelect } from "@/components/ui/Filters";
import { Button } from "@/components/ui/Button";
import { PROGRAM_OPTIONS, SKILL_CATALOGUE } from "@/types";

export interface MatchFilterValues {
  minScore: string;
  skill: string;
  program: string;
  year: string;
  experience: string;
  availability: string;
  sort: "match" | "skill" | "availability" | "experience";
}

export const EMPTY_MATCH_FILTERS: MatchFilterValues = {
  minScore: "",
  skill: "",
  program: "",
  year: "",
  experience: "",
  availability: "",
  sort: "match",
};

const MIN_SCORE_OPTIONS = [
  { value: "90", label: "90% and above" },
  { value: "75", label: "75% and above" },
  { value: "60", label: "60% and above" },
  { value: "40", label: "40% and above" },
];

const YEAR_OPTIONS = ["1", "2", "3", "4", "5"].map((y) => ({ value: y, label: `Year ${y}` }));
const EXPERIENCE_OPTIONS = ["Beginner", "Intermediate", "Advanced"];
const AVAILABILITY_OPTIONS = ["Weekdays", "Weekends", "Morning", "Afternoon", "Evening"];
const SORT_OPTIONS = [
  { value: "match", label: "Best Match" },
  { value: "skill", label: "Skill Coverage" },
  { value: "availability", label: "Availability" },
  { value: "experience", label: "Experience" },
];

export function activeMatchFilterCount(f: MatchFilterValues): number {
  return [f.minScore, f.skill, f.program, f.year, f.experience, f.availability].filter(Boolean).length;
}

export function MatchFilters({
  filters,
  onChange,
  onClear,
}: {
  filters: MatchFilterValues;
  onChange: (next: MatchFilterValues) => void;
  onClear: () => void;
}) {
  const count = activeMatchFilterCount(filters);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FilterSelect
          label="Minimum Match"
          value={filters.minScore}
          onChange={(minScore) => onChange({ ...filters, minScore })}
          options={MIN_SCORE_OPTIONS}
          placeholder="Any score"
        />
        <FilterSelect
          label="Skill"
          value={filters.skill}
          onChange={(skill) => onChange({ ...filters, skill })}
          options={SKILL_CATALOGUE}
          placeholder="Any skill"
        />
        <FilterSelect
          label="Program"
          value={filters.program}
          onChange={(program) => onChange({ ...filters, program })}
          options={PROGRAM_OPTIONS}
          placeholder="All Programs"
        />
        <FilterSelect
          label="Year"
          value={filters.year}
          onChange={(year) => onChange({ ...filters, year })}
          options={YEAR_OPTIONS}
          placeholder="Any year"
        />
        <FilterSelect
          label="Experience"
          value={filters.experience}
          onChange={(experience) => onChange({ ...filters, experience })}
          options={EXPERIENCE_OPTIONS}
          placeholder="All"
        />
        <FilterSelect
          label="Availability"
          value={filters.availability}
          onChange={(availability) => onChange({ ...filters, availability })}
          options={AVAILABILITY_OPTIONS}
          placeholder="Any"
        />
      </div>
      <FilterSelect
        label="Sort by"
        value={filters.sort}
        onChange={(sort) => onChange({ ...filters, sort: sort as MatchFilterValues["sort"] })}
        options={SORT_OPTIONS}
        placeholder="Best Match"
      />
      {count > 0 && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear Filters ({count})
        </Button>
      )}
    </div>
  );
}
