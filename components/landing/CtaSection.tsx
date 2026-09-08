import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CtaSection() {
  return (
    <section className="py-14 sm:py-20" aria-labelledby="cta-heading">
      <div className="container-app">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-accent-600 px-6 py-12 text-center text-white sm:px-12 sm:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-white/10 blur-2xl"
          />
          <h2
            id="cta-heading"
            className="relative mx-auto max-w-2xl text-2xl font-bold !text-white sm:text-3xl"
          >
            Ready to find your perfect project team?
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-white/85">
            Create your profile in minutes and get matched with teammates who
            complement your skills.
          </p>
          <div className="relative mt-7 flex justify-center">
            <Button
              href="/register"
              size="lg"
              className="bg-white font-semibold !text-brand-700 shadow-md hover:!bg-brand-50"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
