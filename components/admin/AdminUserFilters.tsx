"use client";

import { FilterSelect } from "@/components/ui/Filters";
import { SearchInput } from "@/components/ui/SearchInput";
import { PROGRAM_OPTIONS } from "@/types";

export interface AdminUserFilterValues {
  query: string;
  role: string;
  accountStatus: string;
  teamStatus: string;
  program: string;
}

export const EMPTY_ADMIN_USER_FILTERS: AdminUserFilterValues = {
  query: "",
  role: "",
  accountStatus: "",
  teamStatus: "",
  program: "",
};

export function AdminUserFilters({
  filters,
  onChange,
}: {
  filters: AdminUserFilterValues;
  onChange: (next: AdminUserFilterValues) => void;
}) {
  return (
    <div className="space-y-4">
      <SearchInput
        value={filters.query}
        onChange={(query) => onChange({ ...filters, query })}
        placeholder="Search users by name, email, or program…"
        ariaLabel="Search users"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FilterSelect
          label="Role"
          value={filters.role}
          onChange={(role) => onChange({ ...filters, role })}
          options={["student", "admin"]}
          placeholder="All roles"
        />
        <FilterSelect
          label="Account status"
          value={filters.accountStatus}
          onChange={(accountStatus) => onChange({ ...filters, accountStatus })}
          options={["active", "inactive"]}
          placeholder="All statuses"
        />
        <FilterSelect
          label="Team status"
          value={filters.teamStatus}
          onChange={(teamStatus) => onChange({ ...filters, teamStatus })}
          options={[
            { value: "in-team", label: "In Team" },
            { value: "no-team", label: "No Team" },
          ]}
          placeholder="All"
        />
        <FilterSelect
          label="Program"
          value={filters.program}
          onChange={(program) => onChange({ ...filters, program })}
          options={PROGRAM_OPTIONS}
          placeholder="All programs"
        />
      </div>
    </div>
  );
}
