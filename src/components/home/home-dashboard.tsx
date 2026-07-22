"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Minus, Download } from "lucide-react";
import { useIkigai } from "@/components/providers/ikigai-provider";
import { mapProgress } from "@/lib/synthesis";
import { downloadMarkdown } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    key: "want" as const,
    label: "What I want",
    href: "/map#want",
    hint: "Direction",
  },
  {
    key: "offer" as const,
    label: "What I deliver",
    href: "/map#offer",
    hint: "Product / service",
  },
  {
    key: "need" as const,
    label: "Who needs it",
    href: "/map#need",
    hint: "Demand",
  },
  {
    key: "reward" as const,
    label: "How I’m rewarded",
    href: "/map#reward",
    hint: "Exchange",
  },
  {
    key: "skillsHave" as const,
    label: "Skills I have",
    href: "/skills",
    hint: "Assets",
  },
  {
    key: "skillsLack" as const,
    label: "Skills I lack",
    href: "/skills",
    hint: "Gaps",
  },
];

export function HomeDashboard() {
  const { ready, data } = useIkigai();
  const map = data.map;
  const progress = mapProgress(map);
  const pct = Math.round((progress.filled / progress.total) * 100);
  const next = SECTIONS.find((s) => !progress[s.key]);

  if (!ready) {
    return (
      <div className="animate-pulse space-y-4 py-8">
        <div className="h-10 w-48 rounded bg-[var(--surface-2)]" />
        <div className="h-24 rounded-xl bg-[var(--surface-2)]" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section className="pt-2 sm:pt-4">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-display text-sm font-semibold tracking-[0.18em] text-[var(--accent)] uppercase"
        >
          Ikigai 2.0
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
          className="mt-3 font-display text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl"
        >
          Figure out what you want.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mt-3 max-w-lg text-[var(--muted)]"
        >
          Map your purpose, skills, and how you want to be rewarded. Keep it
          precise.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 flex flex-wrap gap-3"
        >
          <Button asChild size="lg" variant="accent">
            <Link href={next?.href ?? "/map"}>
              {progress.filled === 0
                ? "Start your map"
                : next
                  ? `Continue — ${next.label}`
                  : "Review map"}
              <ArrowRight />
            </Link>
          </Button>
          {map && (
            <Button
              size="lg"
              variant="secondary"
              onClick={() => downloadMarkdown()}
            >
              <Download />
              Export
            </Button>
          )}
        </motion.div>
      </section>

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="space-y-3"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-sm font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
            Progress
          </h2>
          <span className="text-sm tabular-nums text-[var(--muted)]">
            {progress.filled}/{progress.total}
          </span>
        </div>
        <Progress value={pct} />
        <ul className="mt-4 divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {SECTIONS.map((s) => {
            const done = progress[s.key];
            return (
              <li key={s.key}>
                <Link
                  href={s.href}
                  className="flex items-center gap-3 py-3.5 transition hover:bg-[var(--surface)]/60"
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border",
                      done
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "border-[var(--border)] text-[var(--muted)]"
                    )}
                  >
                    {done ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Minus className="size-3.5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-[var(--foreground)]">
                      {s.label}
                    </span>
                    <span className="text-xs text-[var(--muted)]">{s.hint}</span>
                  </span>
                  <ArrowRight className="size-4 text-[var(--muted)]" />
                </Link>
              </li>
            );
          })}
        </ul>
      </motion.section>

      {map?.synthesis?.trim() && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border-l-2 border-[var(--accent)] pl-5"
        >
          <h2 className="font-display text-sm font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
            Synthesis
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[var(--foreground)]">
            {map.synthesis}
          </p>
          <Button asChild variant="ghost" className="mt-3 px-0">
            <Link href="/map#synthesis">
              Edit
              <ArrowRight />
            </Link>
          </Button>
        </motion.section>
      )}

      {map && map.skillsLack.some((s) => s.name.trim()) && (
        <section>
          <h2 className="font-display text-sm font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
            Gaps to close
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {map.skillsLack
              .filter((s) => s.name.trim())
              .map((s) => (
                <li
                  key={s.id}
                  className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--foreground)]"
                >
                  {s.name}
                </li>
              ))}
          </ul>
          <Button asChild variant="ghost" className="mt-3 px-0">
            <Link href="/skills">
              Manage skills
              <ArrowRight />
            </Link>
          </Button>
        </section>
      )}
    </div>
  );
}
