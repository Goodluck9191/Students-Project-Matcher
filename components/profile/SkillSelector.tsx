"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { SKILL_CATALOGUE } from "@/types";
import { cn } from "@/lib/utils";

function OptionList({
  id,
  title,
  options,
  selected,
  onToggle,
  searchPlaceholder,
}: {
  id: string;
  title: string;
  options: readonly string[];
  selected: readonly string[];
  onToggle: (value: string) => void;
  searchPlaceholder: string;
}) {
  const [query, setQuery] = React.useState("");
  const filtered = options.filter((o) =>
    o.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="text-xs text-slate-500" aria-live="polite">
          {selected.length} selected
        </span>
      </div>

      {selected.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2" aria-label={`Selected ${id}`}>
          {selected.map((s) => (
            <span key={s} className="inline-flex">
              <Badge variant="primary" className="gap-1 py-1 pl-3 pr-1.5">
                {s}
                <button
                  type="button"
                  onClick={() => onToggle(s)}
                  aria-label={`Remove ${s}`}
                  className="rounded-full p-0.5 hover:bg-brand-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </Badge>
            </span>
          ))}
        </div>
      )}

      <div className="mt-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={searchPlaceholder}
          ariaLabel={searchPlaceholder}
        />
      </div>

      <div
        className="mt-3 flex max-h-56 flex-wrap gap-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/60 p-3 slim-scroll"
        role="group"
        aria-label={title}
      >
        {filtered.length === 0 && (
          <p className="w-full px-1 py-4 text-center text-sm text-slate-500">
            No matches for “{query}”.
          </p>
        )}
        {filtered.map((option) => {
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
                  ? "bg-brand-600 text-white ring-brand-600"
                  : "bg-white text-slate-600 ring-slate-300 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SkillSelector({
  selected,
  onChange,
  options = SKILL_CATALOGUE,
  error,
}: {
  selected: readonly string[];
  onChange: (next: string[]) => void;
  options?: readonly string[];
  error?: string;
}) {
  function toggle(skill: string) {
    onChange(
      selected.includes(skill)
        ? selected.filter((s) => s !== skill)
        : [...selected, skill]
    );
  }

  return (
    <div>
      <OptionList
        id="skills"
        title="Your Skills"
        options={options}
        selected={selected}
        onToggle={toggle}
        searchPlaceholder="Search skills…"
      />
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
