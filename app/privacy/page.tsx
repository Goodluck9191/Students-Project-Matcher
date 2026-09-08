import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="container-app max-w-3xl flex-1 py-10 sm:py-14">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">
          Demo placeholder — a full privacy policy will be published before launch.
        </p>
        <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-slate-600">
          <p>
            Project Matcher is a university project-matching platform. Profile
            information you provide (such as program, skills, interests, and
            availability) is used solely to recommend suitable teammates and
            projects.
          </p>
          <p>
            We do not sell student data. Authentication and data storage will be
            handled by Supabase with row-level security, so students can only
            access data they are permitted to see.
          </p>
          <p>
            Questions? Contact us at{" "}
            <a
              href="mailto:hello@projectmatcher.edu"
              className="font-medium text-brand-700 hover:underline"
            >
              hello@projectmatcher.edu
            </a>
            .
          </p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
