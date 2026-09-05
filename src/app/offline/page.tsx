const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/map", label: "Map" },
  { href: "/notes", label: "Notes" },
  { href: "/daily", label: "Daily" },
  { href: "/growth", label: "Growth" },
  { href: "/skills", label: "Skills" },
  { href: "/insights", label: "Insights" },
  { href: "/timeline", label: "Timeline" },
];

export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-md space-y-4 py-10 text-center">
      <p className="font-display text-2xl font-semibold tracking-tight">
        You’re offline
      </p>
      <p className="text-sm text-[var(--muted)]">
        This page was not cached yet. Open it once while online, then it will
        be available without a network. Cached pages still open from the links
        below.
      </p>
      <nav className="flex flex-wrap justify-center gap-2">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
