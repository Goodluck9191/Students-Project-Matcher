import { FolderKanban, UserRound, UsersRound, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

const STEPS = [
  {
    icon: UserRound,
    step: "Step 1",
    title: "Create Your Profile",
    description:
      "Add your program, year, skills, interests, availability, and experience level so matching starts from who you really are.",
  },
  {
    icon: FolderKanban,
    step: "Step 2",
    title: "Create or Discover a Project",
    description:
      "Start a new academic project with required skills, or browse open projects looking for someone like you.",
  },
  {
    icon: Sparkles,
    step: "Step 3",
    title: "Get Matched With Suitable Teammates",
    description:
      "Receive recommendations ranked by complementary skill coverage — not just identical profiles — plus interests and availability fit.",
  },
  {
    icon: UsersRound,
    step: "Step 4",
    title: "Build Your Team",
    description:
      "Invite students, accept requests, and form a balanced team ready to deliver a great project.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-white py-14 sm:py-20">
      <div className="container-app">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            How it works
          </p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
            From profile to project team in four steps
          </h2>
          <p className="mt-3 text-slate-600">
            A guided flow designed for coursework, final-year projects,
            hackathons, and research teams.
          </p>
        </div>
        <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative">
              <Card className="h-full">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <s.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-brand-600">
                    {s.step}
                  </p>
                  <h3 className="mt-1 font-semibold text-slate-900">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                    {s.description}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
