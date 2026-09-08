import Link from "next/link";

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Projects", href: "/projects" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/#how-it-works" },
      { label: "Contact", href: "mailto:hello@projectmatcher.edu" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container-app grid gap-8 py-10 text-sm sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="font-bold text-slate-900">Project Matcher</p>
          <p className="mt-2 leading-relaxed text-slate-500">
            Smart project team matching for universities. Matching, not dating.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.heading} aria-label={`Footer — ${col.heading}`}>
            <p className="font-semibold text-slate-900">{col.heading}</p>
            <ul className="mt-2 space-y-1.5 text-slate-500">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-slate-800">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © 2026 Project Matcher · Built for university project teams
      </div>
    </footer>
  );
}
