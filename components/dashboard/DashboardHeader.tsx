import { Plus, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/Button";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardHeader({ firstName }: { firstName: string }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Find the right teammates and build your next great project.
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        <Button href="/projects/create" className="w-full sm:w-auto">
          <Plus className="h-4 w-4" /> Create Project
        </Button>
        <Button href="/matches" variant="outline" className="w-full sm:w-auto">
          <UsersRound className="h-4 w-4" /> Find Teammates
        </Button>
      </div>
    </div>
  );
}
