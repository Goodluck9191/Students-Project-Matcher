import { Progress } from "@/components/ui/Progress";

export function ProfileCompletion({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">Profile completion</span>
        <span className="font-semibold text-brand-700" aria-live="polite">
          {Math.round(value)}%
        </span>
      </div>
      <Progress value={value} ariaLabel="Profile completion" />
    </div>
  );
}
