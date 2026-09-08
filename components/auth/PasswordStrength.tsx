"use client";

import { cn } from "@/lib/utils";
import { getPasswordStrength } from "@/lib/services/auth";

const LEVELS = [
  { key: "weak", label: "Weak", bar: "bg-rose-500", width: "w-1/4" },
  { key: "fair", label: "Fair", bar: "bg-amber-500", width: "w-2/4" },
  { key: "good", label: "Good", bar: "bg-sky-500", width: "w-3/4" },
  { key: "strong", label: "Strong", bar: "bg-emerald-500", width: "w-full" },
] as const;

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const strength = getPasswordStrength(password);
  const level = LEVELS.find((l) => l.key === strength) ?? LEVELS[0];

  return (
    <div className="mt-2" aria-live="polite">
      <div
        className="h-1.5 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={LEVELS.indexOf(level) + 1}
        aria-valuemin={1}
        aria-valuemax={4}
        aria-label={`Password strength: ${level.label}`}
      >
        <div className={cn("h-full rounded-full transition-all", level.bar, level.width)} />
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Password strength:{" "}
        <span className="font-semibold text-slate-700">{level.label}</span>
      </p>
    </div>
  );
}
