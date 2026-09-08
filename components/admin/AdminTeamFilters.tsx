"use client";

import { FilterSelect } from "@/components/ui/Filters";
import { SearchInput } from "@/components/ui/SearchInput";
import { PROJECT_CATEGORY_OPTIONS } from "@/types";

export interface AdminTeamFilterValues {
  query: string;
  status: string;
  capacity: string;
  category: string;
}

export const EMPTY_ADMIN_TEAM_FILTERS: AdminTeamFilterValues = {
  query: "",
  status: "",
  capacity: "",
  category: "",
};

export function AdminTeamFilters({
  filters,
  onChange,
}: {
  filters: AdminTeamFilterValues;
  onChange: (next: AdminTeamFilterValues) => void;
}) {
  return (
    <div className="space-y-4">
      <SearchInput
        value={filters.query}
        onChange={(query) => onChange({ ...filters, query })}
        placeholder="Search teams…"
        ariaLabel="Search teams"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FilterSelect
          label="Status"
          value={filters.status}
          onChange={(status) => onChange({ ...filters, status })}
          options={["Recruiting", "Team Complete", "In Progress", "Completed"]}
          placeholder="All statuses"
        />
        <FilterSelect
          label="Capacity"
          value={filters.capacity}
          onChange={(capacity) => onChange({ ...filters, capacity })}
          options={[
            { value: "open", label: "Has Open Slots" },
            { value: "full", label: "Full" },
          ]}
          placeholder="All"
        />
        <FilterSelect
          label="Project category"
          value={filters.category}
          onChange={(category) => onChange({ ...filters, category })}
          options={PROJECT_CATEGORY_OPTIONS}
          placeholder="All categories"
        />
      </div>
    </div>
  );
}
