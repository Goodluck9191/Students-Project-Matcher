"use client";

import { SKILL_LEVEL_OPTIONS, type SkillProficiency, type SkillWithLevel } from "@/types";

export function SkillLevelSelector({
  skills,
  onChange,
}: {
  skills: readonly SkillWithLevel[];
  onChange: (next: SkillWithLevel[]) => void;
}) {
  if (skills.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-slate-900">Skill level</h3>
      <p className="mt-0.5 text-[13px] text-slate-500">
        Your level per skill helps the matching engine balance teams.
      </p>
      <ul className="mt-3 space-y-2">
        {skills.map((s) => (
          <li
            key={s.skill}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5"
          >
            <span className="truncate text-sm font-medium text-slate-800">
              {s.skill}
            </span>
            <label className="flex shrink-0 items-center gap-2 text-sm text-slate-500">
              <span className="sr-only">Level for {s.skill}</span>
              <select
                value={s.level}
                onChange={(e) =>
                  onChange(
                    skills.map((item) =>
                      item.skill === s.skill
                        ? { ...item, level: e.target.value as SkillProficiency }
                        : item
                    )
                  )
                }
                className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm font-medium text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                {SKILL_LEVEL_OPTIONS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
