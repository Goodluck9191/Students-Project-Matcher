"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { INTEREST_CATALOGUE } from "@/types";
import { cn } from "@/lib/utils";

export function InterestSelector({
  selected,
  onChange,
  error,
}: {
  selected: readonly string[];
  onChange: (next: string[]) => void;
  error?: string;
}) {
  const [query, setQuery] = React.useState("");
  const filtered = INTEREST_CATALOGUE.filter((o) =>
    o.toLowerCase().includes(query.trim().toLowerCase())
  );

  function toggle(interest: string) {
    onChange(
      selected.includes(interest)
        ? selected.filter((s) => s !== interest)
        : [...selected, interest]
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">Your Interests</h3>
        <span className="text-xs text-slate-500" aria-live="polite">
          {selected.length} selected
        </span>
      </div>

      {selected.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2" aria-label="Selected interests">
          {selected.map((s) => (
            <span key={s} className="inline-flex">
              <Badge variant="info" className="gap-1 py-1 pl-3 pr-1.5">
                {s}
                <button
                  type="button"
                  onClick={() => toggle(s)}
                  aria-label={`Remove ${s}`}
                  className="rounded-full p-0.5 hover:bg-cyan-200"
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
          placeholder="Search interests…"
          ariaLabel="Search interests"
        />
      </div>

      <div
        className="mt-3 flex max-h-56 flex-wrap gap-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/60 p-3 slim-scroll"
        role="group"
        aria-label="Available interests"
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
              onClick={() => toggle(option)}
              className={cn(
                "h-8 rounded-full px-3 text-[13px] font-medium ring-1 ring-inset transition-colors",
                active
                  ? "bg-cyan-600 text-white ring-cyan-600"
                  : "bg-white text-slate-600 ring-slate-300 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
