import { Progress } from "@/components/ui/Progress";

export function TeamCapacity({
  current,
  max,
}: {
  current: number;
  max: number;
}) {
  const full = current >= max;
  const pct = Math.round((Math.min(current, max) / max) * 100);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)]">
      <h3 className="text-[15px] font-semibold text-slate-900">Team Capacity</h3>
      {full ? (
        <p className="mt-2 text-sm font-semibold text-emerald-700">Team Complete</p>
      ) : null}
      <p className="mt-1 text-sm text-slate-600">
        {current} / {max} members
      </p>
      <div className="mt-2.5">
        <Progress value={pct} ariaLabel={`Team capacity ${current} of ${max}`} />
      </div>
      <p className="mt-2 text-[13px] text-slate-500">
        {full
          ? "This team is full."
          : `${max - current} position${max - current === 1 ? "" : "s"} available`}
      </p>
    </div>
  );
}
