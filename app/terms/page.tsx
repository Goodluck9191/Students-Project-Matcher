import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="container-app max-w-3xl flex-1 py-10 sm:py-14">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-500">
          Demo placeholder — full terms will be published before launch.
        </p>
        <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-slate-600">
          <p>
            Project Matcher helps university students form academic project
            teams. By using the platform you agree to provide accurate profile
            information and to interact with fellow students respectfully.
          </p>
          <p>
            Match recommendations are suggestions based on profile data — they
            do not guarantee team placement, grades, or project outcomes.
          </p>
          <p>
            Misuse, harassment, or misrepresentation may result in removal from
            the platform by your institution&apos;s administrator.
          </p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
