"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Wand2 } from "lucide-react";
import type { PurposeMap } from "@/lib/types";
import { createEmptyMap, generateSynthesis } from "@/lib/synthesis";
import { useIkigai } from "@/components/providers/ikigai-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FIELDS: {
  key: keyof Pick<PurposeMap, "want" | "offer" | "need" | "reward">;
  id: string;
  title: string;
  classic: string;
  question: string;
  placeholder: string;
}[] = [
  {
    key: "want",
    id: "want",
    title: "What I want",
    classic: "What you love",
    question:
      "What do you want badly enough to rearrange your life for? Be specific.",
    placeholder: "e.g. Build and own a product that helps X do Y without Z.",
  },
  {
    key: "offer",
    id: "offer",
    title: "What I deliver",
    classic: "Intersection — love × skill × need",
    question:
      "What will you build or deliver that other people would want to own or use?",
    placeholder: "e.g. A tool, service, or body of work people would pay for.",
  },
  {
    key: "need",
    id: "need",
    title: "Who needs it",
    classic: "What the world needs",
    question: "Who needs this, and why do they care enough to act?",
    placeholder: "e.g. Freelancers who waste hours on admin every week.",
  },
  {
    key: "reward",
    id: "reward",
    title: "How I’m rewarded",
    classic: "What you can be paid for",
    question: "How do you want society to reward you for delivering this?",
    placeholder: "e.g. Recurring revenue, equity, reputation, freedom of time.",
  },
];

export function PurposeMapPage() {
  const { ready, data, upsertMap } = useIkigai();
  const [map, setMap] = useState<PurposeMap>(createEmptyMap);
  const [savedFlash, setSavedFlash] = useState(false);
  const hydrated = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!ready || hydrated.current) return;
    setMap(data.map ?? createEmptyMap());
    hydrated.current = true;
  }, [ready, data.map]);

  const persist = useCallback(
    (next: PurposeMap) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        upsertMap({ ...next, updatedAt: new Date().toISOString() });
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1000);
      }, 350);
    },
    [upsertMap]
  );

  const updateField = (
    key: keyof Pick<PurposeMap, "want" | "offer" | "need" | "reward" | "synthesis">,
    value: string
  ) => {
    setMap((prev) => {
      const next = { ...prev, [key]: value };
      persist(next);
      return next;
    });
  };

  const handleGenerate = () => {
    const statement = generateSynthesis(map);
    if (!statement) return;
    updateField("synthesis", statement);
  };

  if (!ready) {
    return (
      <div className="animate-pulse space-y-4 py-8">
        <div className="h-8 w-40 rounded bg-[var(--surface-2)]" />
        <div className="h-40 rounded-xl bg-[var(--surface-2)]" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
            Map
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Four questions
          </h1>
          <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
            Mapped to classic ikigai. Skills (what you’re good at) are on the
            Skills page — edit them anytime.
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-xs transition-opacity",
            savedFlash
              ? "text-[var(--accent)] opacity-100"
              : "text-[var(--muted)] opacity-40"
          )}
        >
          <Check className="size-3.5" />
          Saved
        </span>
      </header>

      <div className="space-y-8">
        {FIELDS.map((field, i) => (
          <motion.section
            key={field.key}
            id={field.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.35 }}
            className="scroll-mt-24"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="font-display text-xl font-semibold text-[var(--foreground)]">
                {field.title}
              </h2>
              <span className="text-xs text-[var(--muted)]">
                ← {field.classic}
              </span>
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">{field.question}</p>
            <Textarea
              value={map[field.key]}
              onChange={(e) => updateField(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="mt-4 min-h-[120px]"
              aria-label={field.title}
            />
          </motion.section>
        ))}
      </div>

      <motion.section
        id="synthesis"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="scroll-mt-24 border-t border-[var(--border)] pt-10"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-[var(--foreground)]">
              Synthesis
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              A plain summary of what you wrote. Edit freely.
            </p>
          </div>
          <Button variant="accent" onClick={handleGenerate}>
            <Wand2 />
            Build from answers
          </Button>
        </div>
        <Textarea
          value={map.synthesis}
          onChange={(e) => updateField("synthesis", e.target.value)}
          placeholder="Fill the questions above, then build a synthesis — or write your own."
          className="mt-5 min-h-[160px] font-display text-base leading-relaxed"
          aria-label="Synthesis"
        />
      </motion.section>
    </div>
  );
}
