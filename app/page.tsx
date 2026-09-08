import type { Metadata } from "next";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Stats } from "@/components/landing/Stats";
import { CtaSection } from "@/components/landing/CtaSection";

export const metadata: Metadata = {
  title: "Project Matcher — Find the Right Teammates for Your Project",
  description:
    "Project Matcher helps university students discover compatible teammates based on skills, interests, availability, academic program, experience, and project requirements.",
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Features />
        <Stats />
        <CtaSection />
      </main>
      <PublicFooter />
    </div>
  );
}
