import {
  Compass,
  IdCard,
  Puzzle,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Smart Team Matching",
    description:
      "Match scores weigh skills, interests, availability, program, year, and experience — ranked so the best fit rises to the top.",
  },
  {
    icon: Target,
    title: "Skill-Based Recommendations",
    description:
      "Get teammate suggestions tied to your project's required skills, with a clear explanation of why each match fits.",
  },
  {
    icon: Compass,
    title: "Project Discovery",
    description:
      "Search and filter open projects by category, skills, program, year, and team size to find work worth joining.",
  },
  {
    icon: Puzzle,
    title: "Complementary Skills",
    description:
      "We prioritize what your team is missing. If you already have backend covered, we surface the UI/UX or testing talent that balances the team.",
  },
  {
    icon: UsersRound,
    title: "Team Formation",
    description:
      "Invite candidates, track requests, and assemble the team — all from one workspace built for student projects.",
  },
  {
    icon: IdCard,
    title: "Student Profiles",
    description:
      "Rich academic profiles with skills, interests, availability, experience, and current projects — made for universities, not dating.",
  },
] as const;

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 py-14 sm:py-20">
      <div className="container-app">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            Features
          </p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
            Everything you need to build a balanced team
          </h2>
          <p className="mt-3 text-slate-600">
            Balanced teams beat identical teams. Project Matcher looks for the
            skills your project still needs — so every member adds something
            new.
          </p>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="h-full">
              <CardContent>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <f.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  {f.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
