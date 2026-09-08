import Link from "next/link";
import { ArrowRight, CheckCircle2, Compass } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";

/**
 * Landing hero: headline, subheadline, CTAs + a product-style visual
 * showing a project match (students collaborating on an academic project).
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-50/80 via-transparent to-transparent"
      />
      <div className="container-app relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:gap-14 lg:py-20">
        <div>
          <Badge variant="primary" className="mb-4">
            Smart project team matching
          </Badge>
          <h1 className="text-4xl font-bold leading-[1.08] sm:text-5xl">
            Find the Right Teammates for Your Project
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Project Matcher helps university students discover compatible
            teammates based on skills, interests, availability, academic
            program, experience, and project requirements.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button href="/register" size="lg" className="w-full sm:w-auto">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              href="/projects"
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              <Compass className="h-4 w-4" /> Explore Projects
            </Button>
          </div>
          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            {[
              ["Complementary skills", "balanced teams"],
              ["Program & year aware", "relevant peers"],
              ["Availability fit", "real schedules"],
            ].map(([term, detail]) => (
              <div key={term} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <div>
                  <dt className="font-semibold text-slate-900">{term}</dt>
                  <dd className="text-slate-500">{detail}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        {/* Product visual: project match card + collaborator stack */}
        <div className="relative" aria-label="Example project match preview">
          <div
            aria-hidden
            className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-brand-100/70 via-accent-100/50 to-transparent blur-2xl"
          />
          <Card className="relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 sm:px-6">
              <div className="flex items-center gap-2.5">
                <Avatar name="Sarah Chen" size="sm" />
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-slate-900">
                    Campus Asset Management
                  </p>
                  <p className="text-xs text-slate-500">
                    Web Development · Final Year
                  </p>
                </div>
              </div>
              <Badge variant="success">94% match</Badge>
            </div>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">
                    Skills covered
                  </span>
                  <span className="text-slate-500">4 of 5</span>
                </div>
                <Progress value={80} />
              </div>
              <ul className="space-y-2 text-sm">
                {[
                  ["React + TypeScript", "covered by Alex"],
                  ["Node.js + PostgreSQL", "covered by Priya"],
                  ["UI/UX — missing", "Sarah is the fit"],
                ].map(([text, sub]) => (
                  <li
                    key={text}
                    className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="font-medium text-slate-800">{text}</span>
                    <span className="ml-auto hidden text-xs text-slate-500 sm:block">
                      {sub}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between rounded-xl bg-brand-50/70 px-3 py-2.5 ring-1 ring-inset ring-brand-100">
                <div className="flex -space-x-2">
                  {["Alex Morgan", "Priya Nair", "Sarah Chen", "Tom Becker"].map(
                    (name) => (
                      <Avatar
                        key={name}
                        name={name}
                        size="sm"
                        className="ring-2 ring-white"
                      />
                    )
                  )}
                </div>
                <Link
                  href="/register"
                  className="text-sm font-semibold text-brand-700 hover:text-brand-800"
                >
                  Meet your team →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
