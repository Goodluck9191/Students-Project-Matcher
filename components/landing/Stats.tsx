/**
 * Demo statistics for the landing page.
 * TODO (Supabase): replace with aggregate queries
 * (e.g. `from("profiles").select("*", { count: "exact", head: true })`).
 */
export const LANDING_STATS = [
  { value: "1,200+", label: "Students" },
  { value: "180+", label: "Projects" },
  { value: "250+", label: "Teams" },
  { value: "900+", label: "Matches" },
] as const;

export function Stats() {
  return (
    <section aria-label="Platform statistics" className="bg-white py-14 sm:py-16">
      <div className="container-app">
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {LANDING_STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-slate-200/80 bg-[#f6f8fb] px-4 py-6 text-center"
            >
              <dd className="text-3xl font-bold text-brand-700 sm:text-4xl">
                {s.value}
              </dd>
              <dt className="mt-1 text-sm font-medium text-slate-500">
                {s.label}
              </dt>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-center text-xs text-slate-400">
          Demo figures for illustration — live counts will be powered by
          Supabase.
        </p>
      </div>
    </section>
  );
}
