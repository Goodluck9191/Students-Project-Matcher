"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/Button";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "/projects", label: "Projects" },
];

export function PublicHeader() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav
          className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex"
          aria-label="Public"
        >
          {NAV_LINKS.map((l) => (
            <Link key={l.href + l.label} href={l.href} className="hover:text-slate-900">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button href="/login" variant="ghost" size="sm">
            Log in
          </Button>
          <Button href="/register" size="sm">
            Get Started
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      {open && (
        <nav
          aria-label="Mobile"
          className="border-t border-slate-100 bg-white px-4 py-3 md:hidden"
        >
          <ul className="space-y-1">
            {NAV_LINKS.map((l) => (
              <li key={l.href + l.label}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-2.5 text-[15px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
            <Button href="/login" variant="outline" size="sm" className="flex-1">
              Log in
            </Button>
            <Button href="/register" size="sm" className="flex-1">
              Get Started
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
