import { Scale } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";

export function ComplementarySkillsCard({
  strongest,
  missing,
}: {
  strongest: string[];
  missing: string[];
}) {
  return (
    <Card className="border-brand-200 bg-gradient-to-br from-brand-600 to-accent-600 text-white">
      <CardContent className="py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
            <Scale className="h-4.5 w-4.5" aria-hidden />
          </span>
          <h2 className="font-semibold !text-white">Build a Balanced Team</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-white/85">
          We recommend students who fill your gaps — not clones of your skills.
        </p>
        <div className="mt-3 space-y-2.5 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
              Your strongest skills
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {strongest.map((s) => (
                <Badge key={s} className="border-0 bg-white/15 text-white">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
              Skills your project still needs
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {missing.map((s) => (
                <Badge key={s} className="border-0 bg-white font-semibold !text-brand-800">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
