import { cn, clamp } from "@/lib/utils";

export function Progress({
  value,
  className,
  barClassName,
  ariaLabel = "Progress",
}: {
  value: number;
  className?: string;
  barClassName?: string;
  ariaLabel?: string;
}) {
  const v = clamp(value);
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
      aria-label={ariaLabel}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-100", className)}
    >
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r from-brand-600 to-accent-500 transition-all duration-500",
          barClassName
        )}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
