"use client";

import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type MatchView = "grid" | "list";

export function MatchViewToggle({
  view,
  onChange,
}: {
  view: MatchView;
  onChange: (view: MatchView) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Change results view"
      className="inline-flex rounded-xl border border-slate-300 bg-white p-1"
    >
      {(
        [
          { value: "grid", label: "Grid", Icon: LayoutGrid },
          { value: "list", label: "List", Icon: List },
        ] as const
      ).map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={view === value}
          onClick={() => onChange(value)}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors",
            view === value
              ? "bg-brand-600 text-white"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}
