"use client";

import * as React from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { MobileNav, BottomNav } from "./MobileNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-[#f6f8fb]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <main className="container-app flex-1 py-6 pb-24 sm:py-8 lg:pb-10">
          {children}
        </main>
        <footer className="hidden border-t border-slate-200/70 bg-white px-6 py-4 lg:block">
          <p className="mx-auto max-w-7xl text-xs text-slate-400">
            Project Matcher · Smart project team matching for universities · Stage 1 foundation
          </p>
        </footer>
      </div>
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <BottomNav />
    </div>
  );
}
