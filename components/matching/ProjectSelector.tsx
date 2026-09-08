import { cn } from "@/lib/utils";
import type { Project } from "@/types";

export function ProjectSelector({
  projects,
  value,
  onChange,
}: {
  projects: Project[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <label className="block max-w-md">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        Match teammates for:
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Select project to match teammates for"
        className={cn(
          "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900",
          "shadow-[0_1px_2px_rgb(15_23_42/0.04)] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        )}
      >
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title} ({p.currentMembers}/{p.maxTeamSize})
          </option>
        ))}
      </select>
    </label>
  );
}
