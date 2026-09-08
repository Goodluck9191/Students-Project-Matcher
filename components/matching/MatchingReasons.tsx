import { CheckCircle2 } from "lucide-react";

/** "Why this match?" explanation checklist — never a bare percentage. */
export function MatchingReasons({
  reasons,
  compact = false,
}: {
  reasons: string[];
  compact?: boolean;
}) {
  if (reasons.length === 0) return null;
  const shown = compact ? reasons.slice(0, 2) : reasons;
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-inset ring-slate-100">
      {!compact && (
        <p className="text-[13px] font-semibold text-slate-700">Why this match?</p>
      )}
      <ul className="mt-1 space-y-1">
        {shown.map((r) => (
          <li key={r} className="flex items-start gap-1.5 text-[13px] text-slate-600">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
