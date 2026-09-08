import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { Card, CardContent } from "@/components/ui/Card";

/** Centered card shell shared by login / register / forgot-password. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f6f8fb]">
      <div className="container-app flex h-16 items-center">
        <Logo />
      </div>
      <main className="flex flex-1 items-start justify-center px-4 pb-12 pt-4 sm:items-center sm:pt-8">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="py-6 sm:py-7">
              <h1 className="text-xl font-bold text-slate-900">{title}</h1>
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
              <div className="mt-6">{children}</div>
            </CardContent>
          </Card>
          {footer && (
            <p className="mt-5 text-center text-sm text-slate-500">{footer}</p>
          )}
          <p className="mt-3 text-center text-xs text-slate-400">
            <Link href="/" className="hover:text-slate-600 hover:underline">
              ← Back to home
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
