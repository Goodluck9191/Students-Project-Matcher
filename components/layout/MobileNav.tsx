"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { STUDENT_NAV } from "@/lib/navigation";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/Button";

export function MobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
      <button
        aria-label="Close navigation"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-slate-950/45"
      />
      <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] animate-slide-in flex-col bg-white shadow-[var(--shadow-pop)]">
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
          <Logo />
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="slim-scroll flex-1 overflow-y-auto p-3" aria-label="Mobile">
          <ul className="space-y-1">
            {STUDENT_NAV.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium",
                      active
                        ? "bg-brand-50 text-brand-800 ring-1 ring-inset ring-brand-100"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", active ? "text-brand-600" : "text-slate-400")} />
                    <span className="flex-1">{item.label}</span>
                    {typeof item.badge === "number" && (
                      <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const items = STUDENT_NAV.slice(0, 5);

  return (
    <nav
      aria-label="Bottom"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                  active ? "text-brand-700" : "text-slate-500"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="max-w-full truncate px-1">
                  {item.label.replace("Find Teammates", "Match").replace("My Teams", "Teams")}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
