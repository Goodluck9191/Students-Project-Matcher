import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Project Matcher home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 text-white shadow-sm transition-transform group-hover:scale-[1.03]">
        <GraduationCap className="h-5 w-5" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-[15px] font-bold tracking-tight text-slate-900">
            Project Matcher
          </span>
          <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-400">
            University Teams
          </span>
        </span>
      )}
    </Link>
  );
}
