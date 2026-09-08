export function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1" role="separator" aria-label={label}>
      <span aria-hidden className="h-px flex-1 bg-slate-200" />
      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span aria-hidden className="h-px flex-1 bg-slate-200" />
    </div>
  );
}
