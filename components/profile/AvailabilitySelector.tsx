"use client";

import { DAY_TIME_OPTIONS, WEEKDAY_OPTIONS, WORK_STYLE_OPTIONS } from "@/types";
import type { DayTime, Weekday, WorkStyle } from "@/types";
import { cn } from "@/lib/utils";

function ChipRow<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: readonly T[];
  selected: readonly T[];
  onToggle: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-slate-900">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(option)}
              className={cn(
                "h-9 rounded-full px-3.5 text-[13px] font-medium ring-1 ring-inset transition-colors",
                active
                  ? "bg-brand-600 text-white ring-brand-600"
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

export function AvailabilitySelector({
  days,
  times,
  workStyle,
  onDaysChange,
  onTimesChange,
  onWorkStyleChange,
  error,
  workStyleError,
}: {
  days: readonly Weekday[];
  times: readonly DayTime[];
  workStyle: WorkStyle | undefined;
  onDaysChange: (next: Weekday[]) => void;
  onTimesChange: (next: DayTime[]) => void;
  onWorkStyleChange: (next: WorkStyle) => void;
  error?: string;
  workStyleError?: string;
}) {
  function toggle<T extends string>(list: readonly T[], value: T): T[] {
    return list.includes(value)
      ? list.filter((v) => v !== value)
      : [...list, value];
  }

  return (
    <div className="space-y-6">
      <ChipRow
        label="Which days can you meet?"
        options={WEEKDAY_OPTIONS}
        selected={days}
        onToggle={(d: Weekday) => onDaysChange(toggle(days, d))}
      />
      <ChipRow
        label="What times suit you?"
        options={DAY_TIME_OPTIONS}
        selected={times}
        onToggle={(t: DayTime) => onTimesChange(toggle(times, t))}
      />
      {error && (
        <p role="alert" className="-mt-3 text-[13px] text-rose-600">
          {error}
        </p>
      )}
      <fieldset>
        <legend className="text-sm font-semibold text-slate-900">
          Preferred work style
        </legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {WORK_STYLE_OPTIONS.map((style) => {
            const active = workStyle === style;
            return (
              <button
                key={style}
                type="button"
                aria-pressed={active}
                onClick={() => onWorkStyleChange(style)}
                className={cn(
                  "rounded-xl px-2 py-3 text-sm font-medium ring-1 ring-inset transition-colors",
                  active
                    ? "bg-brand-50 text-brand-800 ring-2 ring-brand-500"
                    : "bg-white text-slate-600 ring-slate-300 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {style}
              </button>
            );
          })}
        </div>
        {workStyleError && (
          <p role="alert" className="mt-2 text-[13px] text-rose-600">
            {workStyleError}
          </p>
        )}
      </fieldset>
    </div>
  );
}
