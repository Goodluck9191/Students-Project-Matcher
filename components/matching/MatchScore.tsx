import { Progress } from "@/components/ui/Progress";
import { tierStyles } from "@/lib/matching/score";
import { cn } from "@/lib/utils";
import type { MatchTier } from "@/types";

/** Prominent match percentage: big number + tier pill + bar. */
export function MatchScore({
  score,
  tier,
  size = "md",
}: {
  score: number;
  tier: MatchTier;
  size?: "md" | "lg";
}) {
  const styles = tierStyles(tier);
  return (
    <div>
      <div className="flex items-end justify-between gap-2">
        <span
          className={cn(
            "font-bold tabular-nums text-slate-900",
            size === "lg" ? "text-4xl" : "text-2xl"
          )}
        >
          {score}
          <span className="text-lg text-slate-400">%</span>
        </span>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset",
            styles.classes
          )}
        >
          {styles.label}
        </span>
      </div>
      <div className="mt-2">
        <Progress value={score} barClassName={styles.bar} ariaLabel={`Match score ${score} percent, ${styles.label}`} />
      </div>
    </div>
  );
}
