"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Compass,
  Flame,
  MessageSquare,
  PenLine,
  Target,
  BarChart3,
  Zap,
} from "lucide-react";
import { QuoteBlock } from "@/components/shared/quote-block";
import { getRotatingQuote } from "@/lib/quotes";
import { getDailyPrompt } from "@/lib/prompts";
import { useIkigai } from "@/components/providers/ikigai-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/input";

const NAV_CARDS = [
  {
    href: "/reflections",
    title: "Reflections",
    description: "Open-ended prompts. Write hard truths. Rate your energy.",
    icon: PenLine,
    cta: "Reflect now",
  },
  {
    href: "/canvas",
    title: "Purpose Canvas",
    description: "Ikigai, values, vision — map what you're aiming at.",
    icon: Compass,
    cta: "Open canvas",
  },
  {
    href: "/goals",
    title: "Goals Portfolio",
    description: "Treat goals like bets. Track skills and opportunities.",
    icon: Target,
    cta: "View portfolio",
  },
  {
    href: "/coach",
    title: "AI Coach",
    description: "Strategic, no-BS counsel in the pmarca spirit.",
    icon: MessageSquare,
    cta: "Talk strategy",
  },
  {
    href: "/review",
    title: "Review",
    description: "Momentum, streaks, export your journal.",
    icon: BarChart3,
    cta: "Review progress",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.15 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function HomeDashboard() {
  const quote = getRotatingQuote(0);
  const daily = getDailyPrompt();
  const { data, ready, reflections } = useIkigai();
  const streak = data.streak;
  const avgEnergy =
    reflections.length > 0
      ? reflections.reduce((s, r) => s + r.energy, 0) / reflections.length
      : 0;
  const avgClarity =
    reflections.length > 0
      ? reflections.reduce((s, r) => s + r.clarity, 0) / reflections.length
      : 0;

  return (
    <div className="space-y-14">
      {/* Hero — brand + one quote + one CTA. No card clutter. */}
      <section className="relative overflow-hidden pb-2 pt-4 sm:pt-8">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.2em] text-amber-500/90"
        >
          Ikigai
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.45 }}
          className="font-display text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl md:text-6xl"
        >
          Know what you want.
          <br />
          <span className="text-zinc-400">Then move with maximum energy.</span>
        </motion.h1>
        <div className="mt-8 max-w-3xl border-l-2 border-amber-500/60 pl-5 sm:pl-6">
          <QuoteBlock quote={quote} large />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          <Button asChild size="lg" variant="accent">
            <Link href="/reflections">
              Start today&apos;s reflection
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/coach">Generate next action</Link>
          </Button>
        </motion.div>
      </section>

      {/* Momentum strip */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid gap-4 sm:grid-cols-3"
      >
        <div className="flex items-center gap-3 rounded-lg border border-zinc-800/60 bg-zinc-900/30 px-4 py-3">
          <Flame className="size-5 text-amber-500" />
          <div>
            <p className="text-xs text-zinc-500">Streak</p>
            <p className="font-display text-xl font-semibold text-zinc-100">
              {ready ? streak.currentStreak : "—"}{" "}
              <span className="text-sm font-normal text-zinc-500">days</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-zinc-800/60 bg-zinc-900/30 px-4 py-3">
          <PenLine className="size-5 text-zinc-400" />
          <div>
            <p className="text-xs text-zinc-500">Reflections</p>
            <p className="font-display text-xl font-semibold text-zinc-100">
              {ready ? streak.totalReflections : "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-zinc-800/60 bg-zinc-900/30 px-4 py-3">
          <Zap className="size-5 text-amber-400" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-zinc-500">Energy / Clarity</p>
            <p className="font-display text-xl font-semibold text-zinc-100">
              {reflections.length
                ? `${avgEnergy.toFixed(1)} / ${avgClarity.toFixed(1)}`
                : "—"}
            </p>
            {reflections.length > 0 && (
              <Progress value={avgEnergy * 10} className="mt-2" />
            )}
          </div>
        </div>
      </motion.section>

      {/* Today's prompt tease */}
      <section className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900/80 to-zinc-950 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-500/80">
          Today&apos;s prompt
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-zinc-50">
          {daily.title}
        </h2>
        <p className="mt-2 max-w-2xl text-zinc-400">{daily.prompt}</p>
        {daily.nudge && (
          <p className="mt-3 text-sm italic text-zinc-500">{daily.nudge}</p>
        )}
        <Button asChild className="mt-6" variant="secondary">
          <Link href={`/reflections?prompt=${daily.id}`}>
            Write your response
            <ArrowRight />
          </Link>
        </Button>
      </section>

      {/* Navigation cards */}
      <section>
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Navigate
        </h2>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {NAV_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.href} variants={item}>
                <Link href={card.href} className="group block h-full">
                  <Card className="h-full transition-colors group-hover:border-zinc-600 group-hover:bg-zinc-900/70">
                    <CardHeader>
                      <div className="mb-2 flex size-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300 transition group-hover:border-amber-500/40 group-hover:text-amber-400">
                        <Icon className="size-4" />
                      </div>
                      <CardTitle>{card.title}</CardTitle>
                      <CardDescription>{card.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <span className="inline-flex items-center gap-1 text-sm text-zinc-400 transition group-hover:text-amber-400">
                        {card.cta}
                        <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </section>
    </div>
  );
}
