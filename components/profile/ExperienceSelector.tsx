"use client";

import { Textarea } from "@/components/ui/Input";
import type { ExperienceLevel } from "@/types";
import { cn } from "@/lib/utils";

const LEVELS: { value: ExperienceLevel; hint: string }[] = [
  { value: "Beginner", hint: "New to project work" },
  { value: "Intermediate", hint: "Built a few projects" },
  { value: "Advanced", hint: "Ships & leads work" },
];

export function ExperienceSelector({
  level,
  onLevelChange,
  previousExperience,
  onPreviousExperienceChange,
}: {
  level: ExperienceLevel;
  onLevelChange: (level: ExperienceLevel) => void;
  previousExperience: string;
  onPreviousExperienceChange: (value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-sm font-semibold text-slate-900">
          Overall experience level
        </legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Experience level">
          {LEVELS.map((l) => {
            const active = level === l.value;
            return (
              <button
                key={l.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onLevelChange(l.value)}
                className={cn(
                  "rounded-xl px-3 py-3.5 text-left ring-1 ring-inset transition-colors",
                  active
                    ? "bg-brand-50 ring-2 ring-brand-500"
                    : "bg-white ring-slate-300 hover:bg-slate-50"
                )}
              >
                <span className="block text-sm font-semibold text-slate-900">
                  {l.value}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">{l.hint}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
      <Textarea
        label="Previous project experience (optional)"
        name="previousExperience"
        placeholder="Describe previous academic, personal, freelance, or open-source projects."
        value={previousExperience}
        onChange={(e) => onPreviousExperienceChange(e.target.value)}
        rows={4}
      />
    </div>
  );
}
