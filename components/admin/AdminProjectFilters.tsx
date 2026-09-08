"use client";

import { FilterSelect } from "@/components/ui/Filters";
import { SearchInput } from "@/components/ui/SearchInput";
import { PROJECT_CATEGORY_OPTIONS, PROJECT_STATUS_OPTIONS } from "@/types";

export interface AdminProjectFilterValues {
  query: string;
  status: string;
  category: string;
  teamState: string;
}

export const EMPTY_ADMIN_PROJECT_FILTERS: AdminProjectFilterValues = {
  query: "",
  status: "",
  category: "",
  teamState: "",
};

export function AdminProjectFilters({
  filters,
  onChange,
}: {
  filters: AdminProjectFilterValues;
  onChange: (next: AdminProjectFilterValues) => void;
}) {
  return (
    <div className="space-y-4">
      <SearchInput
        value={filters.query}
        onChange={(query) => onChange({ ...filters, query })}
        placeholder="Search projects…"
        ariaLabel="Search projects"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FilterSelect
          label="Status"
          value={filters.status}
          onChange={(status) => onChange({ ...filters, status })}
          options={[...PROJECT_STATUS_OPTIONS, "Draft"]}
          placeholder="All statuses"
        />
        <FilterSelect
          label="Category"
          value={filters.category}
          onChange={(category) => onChange({ ...filters, category })}
          options={PROJECT_CATEGORY_OPTIONS}
          placeholder="All categories"
        />
        <FilterSelect
          label="Team state"
          value={filters.teamState}
          onChange={(teamState) => onChange({ ...filters, teamState })}
          options={[
            { value: "no-team", label: "No Team" },
            { value: "recruiting", label: "Recruiting" },
            { value: "complete", label: "Complete" },
          ]}
          placeholder="All"
        />
      </div>
    </div>
  );
}
