import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";

export function ProfileCompletionCard({ completion }: { completion: number }) {
  const complete = completion >= 100;

  if (complete) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 py-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Your profile is complete
          </p>
          <p className="mt-0.5 text-sm text-slate-600">
            You&apos;re ready for personalized project matches.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-brand-200 bg-gradient-to-r from-brand-50/80 to-accent-50/50">
      <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-slate-900">Complete your profile</h2>
          <p className="mt-1 text-sm text-slate-600">
            Your profile is {completion}% complete. Complete your skills and
            availability to get better teammate recommendations.
          </p>
          <div className="mt-3 max-w-md">
            <Progress value={completion} ariaLabel={`Profile ${completion} percent complete`} />
          </div>
        </div>
        <Button href="/profile/setup" className="shrink-0">
          Complete Profile <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
