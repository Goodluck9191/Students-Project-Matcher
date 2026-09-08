import { Check } from "lucide-react";
import { SETUP_STEPS, type SetupStepId } from "@/lib/services/profile";
import { cn } from "@/lib/utils";

export function SetupSteps({
  current,
  onGoTo,
  maxReachable,
}: {
  current: SetupStepId;
  onGoTo: (step: SetupStepId) => void;
  maxReachable: number;
}) {
  const currentIndex = SETUP_STEPS.findIndex((s) => s.id === current);

  return (
    <nav aria-label="Profile setup progress">
      <ol className="flex items-start gap-1 sm:gap-2">
        {SETUP_STEPS.map((step, i) => {
          const done = i < currentIndex;
          const isCurrent = i === currentIndex;
          const reachable = i <= maxReachable;
          return (
            <li key={step.id} className="min-w-0 flex-1">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onGoTo(step.id)}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex w-full flex-col items-center gap-1.5 rounded-xl px-1 py-1 text-center",
                  reachable ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ring-2 transition-colors",
                    done && "bg-emerald-500 text-white ring-emerald-500",
                    isCurrent && "bg-brand-600 text-white ring-brand-600",
                    !done && !isCurrent && "bg-white text-slate-400 ring-slate-200"
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
                </span>
                <span
                  className={cn(
                    "hidden text-[11px] font-medium leading-tight sm:block",
                    isCurrent ? "text-brand-700" : "text-slate-500"
                  )}
                >
                  {step.label}
                </span>
              </button>
              <div
                aria-hidden
                className={cn(
                  "mx-auto mt-1.5 h-1 max-w-10 rounded-full",
                  i < currentIndex ? "bg-emerald-500" : i === currentIndex ? "bg-brand-500" : "bg-slate-200"
                )}
              />
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-center text-sm font-medium text-slate-600 sm:hidden" aria-live="polite">
        Step {currentIndex + 1} of {SETUP_STEPS.length}:{" "}
        {SETUP_STEPS[currentIndex].title}
      </p>
    </nav>
  );
}
