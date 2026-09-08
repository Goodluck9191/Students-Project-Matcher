"use client";

import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

/** Accessible labeled select used for category / skill / program / year / team-size filters. */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "All",
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly (string | FilterOption)[];
  placeholder?: string;
  className?: string;
}) {
  const normalized: FilterOption[] = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );

  return (
    <label className={cn("block min-w-0", className)}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full appearance-none truncate rounded-xl border border-slate-300 bg-white px-3 pr-8 text-sm text-slate-800 shadow-[0_1px_2px_rgb(15_23_42/0.04)] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
      >
        <option value="">{placeholder}</option>
        {normalized.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Multi-select chip group (e.g. skills, interests, availability). */
export function FilterChips({
  label,
  options,
  selected,
  onToggle,
  className,
}: {
  label: string;
  options: readonly string[];
  selected: readonly string[];
  onToggle: (value: string) => void;
  className?: string;
}) {
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(option)}
              className={cn(
                "h-8 rounded-full px-3 text-[13px] font-medium ring-1 ring-inset transition-colors",
                active
                  ? "bg-brand-600 text-white ring-brand-600 hover:bg-brand-700"
                  : "bg-white text-slate-600 ring-slate-300 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
