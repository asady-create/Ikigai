"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Flame,
  Home,
  Compass,
  PenLine,
  Target,
  MessageSquare,
  BarChart3,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useIkigai } from "@/components/providers/ikigai-provider";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/reflections", label: "Reflections", icon: PenLine },
  { href: "/canvas", label: "Purpose Canvas", icon: Compass },
  { href: "/goals", label: "Goals Portfolio", icon: Target },
  { href: "/coach", label: "AI Coach", icon: MessageSquare },
  { href: "/review", label: "Review", icon: BarChart3 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data, ready } = useIkigai();
  const [open, setOpen] = useState(false);
  const streak = ready ? data.streak.currentStreak : 0;

  return (
    <div className="relative min-h-dvh">
      {/* Atmospheric background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-zinc-950" />
        <div className="absolute -left-1/4 top-0 h-[50vh] w-[70vw] rounded-full bg-amber-500/5 blur-3xl" />
        <div className="absolute -right-1/4 bottom-0 h-[40vh] w-[60vw] rounded-full bg-zinc-600/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-2">
            <span className="font-display text-xl font-bold tracking-tight text-zinc-50 transition group-hover:text-amber-400">
              Ikigai
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "text-zinc-50"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-md bg-zinc-800/80"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {ready && streak > 0 && (
              <div className="flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-400">
                <Flame className="size-3.5" />
                {streak}d
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-zinc-800 px-4 py-3 md:hidden"
          >
            <ul className="flex flex-col gap-1">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm",
                        active
                          ? "bg-zinc-900 text-zinc-50"
                          : "text-zinc-400"
                      )}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>

      <footer className="mx-auto max-w-6xl border-t border-zinc-900 px-4 py-8 text-center text-xs text-zinc-600 sm:px-6 print:hidden">
        Privacy-first · All data stays in your browser · The world is malleable
      </footer>
    </div>
  );
}
