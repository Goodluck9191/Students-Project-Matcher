"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropdownOption {
  value: string;
  label: string;
  hint?: string;
}

export function Dropdown({
  label,
  options,
  value,
  onChange,
  placeholder = "Select…",
  className,
}: {
  label?: string;
  options: DropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={cn("relative w-full", className)}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      )}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm",
          "shadow-[0_1px_2px_rgb(15_23_42/0.04)] hover:border-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100",
          !selected && "text-slate-400"
        )}
      >
        <span className={cn("truncate", selected && "text-slate-900")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-30 mt-2 max-h-60 w-full animate-fade-in overflow-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-[var(--shadow-pop)]"
        >
          {options.length === 0 && (
            <li className="px-3 py-2 text-sm text-slate-500">No options</li>
          )}
          {options.map((o) => {
            const active = o.value === value;
            return (
              <li key={o.value}>
                <button
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm",
                    active ? "bg-brand-50 text-brand-800" : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span>
                    <span className="block font-medium">{o.label}</span>
                    {o.hint && <span className="block text-xs text-slate-500">{o.hint}</span>}
                  </span>
                  {active && <Check className="h-4 w-4 text-brand-600" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
