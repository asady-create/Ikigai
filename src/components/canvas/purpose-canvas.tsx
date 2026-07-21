"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Sparkles, Globe, Banknote, Plus, X, Wand2, Check } from "lucide-react";
import type { IkigaiCanvas, PurposeCanvas } from "@/lib/types";
import { createEmptyCanvas, generateVisionStatement } from "@/lib/vision";
import { getRotatingQuote } from "@/lib/quotes";
import { useIkigai } from "@/components/providers/ikigai-provider";
import { QuoteBlock } from "@/components/shared/quote-block";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const QUADRANTS: {
  key: keyof IkigaiCanvas;
  title: string;
  hint: string;
  placeholder: string;
  icon: typeof Heart;
  accent: string;
}[] = [
  {
    key: "love",
    title: "What you love",
    hint: "Obsession, not preference.",
    placeholder: "What makes you lose track of time — and want to go deeper?",
    icon: Heart,
    accent: "border-rose-500/30 hover:border-rose-500/50 focus-within:border-rose-500/60",
  },
  {
    key: "goodAt",
    title: "What you're good at",
    hint: "Your unfair edge.",
    placeholder: "What do people already ask you for? What are you leveling into a double threat?",
    icon: Sparkles,
    accent: "border-amber-500/30 hover:border-amber-500/50 focus-within:border-amber-500/60",
  },
  {
    key: "worldNeeds",
    title: "What the world needs",
    hint: "Urgent and underserved.",
    placeholder: "Which problem feels real — and still lacks someone with your intensity?",
    icon: Globe,
    accent: "border-sky-500/30 hover:border-sky-500/50 focus-within:border-sky-500/60",
  },
  {
    key: "paidFor",
    title: "What you can be paid for",
    hint: "Market pull, not wishful thinking.",
    placeholder: "Where does the market already pay for work adjacent to your love and skill?",
    icon: Banknote,
    accent: "border-emerald-500/30 hover:border-emerald-500/50 focus-within:border-emerald-500/60",
  },
];

export function PurposeCanvasPage() {
  const { ready, data, upsertCanvas } = useIkigai();
  const quote = getRotatingQuote(2);

  const [canvas, setCanvas] = useState<PurposeCanvas>(createEmptyCanvas);
  const [valueDraft, setValueDraft] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [generating, setGenerating] = useState(false);
  const hydrated = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from storage once provider is ready
  useEffect(() => {
    if (!ready || hydrated.current) return;
    setCanvas(data.canvas ?? createEmptyCanvas());
    hydrated.current = true;
  }, [ready, data.canvas]);

  const persist = useCallback(
    (next: PurposeCanvas) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        upsertCanvas({ ...next, updatedAt: new Date().toISOString() });
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1200);
      }, 400);
    },
    [upsertCanvas]
  );

  const updateIkigai = (key: keyof IkigaiCanvas, value: string) => {
    setCanvas((prev) => {
      const next = { ...prev, ikigai: { ...prev.ikigai, [key]: value } };
      persist(next);
      return next;
    });
  };

  const addValue = () => {
    const v = valueDraft.trim();
    if (!v) return;
    if (canvas.values.some((x) => x.toLowerCase() === v.toLowerCase())) {
      setValueDraft("");
      return;
    }
    setCanvas((prev) => {
      const next = { ...prev, values: [...prev.values, v] };
      persist(next);
      return next;
    });
    setValueDraft("");
  };

  const removeValue = (value: string) => {
    setCanvas((prev) => {
      const next = { ...prev, values: prev.values.filter((x) => x !== value) };
      persist(next);
      return next;
    });
  };

  const updateVision = (visionStatement: string) => {
    setCanvas((prev) => {
      const next = { ...prev, visionStatement };
      persist(next);
      return next;
    });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    // Brief pause so the button feels intentional
    await new Promise((r) => setTimeout(r, 450));
    const statement = generateVisionStatement(canvas.ikigai, canvas.values);
    updateVision(statement);
    setGenerating(false);
  };

  if (!ready) {
    return (
      <div className="animate-pulse space-y-4 py-8">
        <div className="h-8 w-56 rounded bg-zinc-800" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-zinc-900" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500/90">
              Purpose Canvas
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
              Map the intersection.
            </h1>
            <p className="mt-2 max-w-xl text-zinc-400">
              Four truths. Your values. One vision worth pursuing with maximum
              energy.
            </p>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs transition-opacity",
              savedFlash ? "opacity-100 text-emerald-400" : "opacity-40 text-zinc-500"
            )}
          >
            <Check className="size-3.5" />
            Saved locally
          </span>
        </div>
        <div className="max-w-2xl border-l-2 border-zinc-700 pl-5">
          <QuoteBlock quote={quote} />
        </div>
      </header>

      {/* Ikigai quadrants */}
      <section>
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Ikigai
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {QUADRANTS.map((q, i) => {
            const Icon = q.icon;
            return (
              <motion.div
                key={q.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className={cn(
                  "rounded-xl border bg-zinc-900/40 p-5 transition-colors",
                  q.accent
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-lg font-semibold text-zinc-50">
                      {q.title}
                    </h3>
                    <p className="text-xs text-zinc-500">{q.hint}</p>
                  </div>
                </div>
                <Textarea
                  value={canvas.ikigai[q.key]}
                  onChange={(e) => updateIkigai(q.key, e.target.value)}
                  placeholder={q.placeholder}
                  className="mt-4 min-h-[120px] border-zinc-800/80 bg-zinc-950/50"
                  aria-label={q.title}
                />
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Core values */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 sm:p-6"
      >
        <h2 className="font-display text-xl font-semibold text-zinc-50">
          Core values
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Non-negotiables. Add a few. Cut anything soft.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {canvas.values.length === 0 && (
            <p className="text-sm text-zinc-600">No values yet — add your first.</p>
          )}
          {canvas.values.map((value) => (
            <span
              key={value}
              className="group inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200"
            >
              {value}
              <button
                type="button"
                onClick={() => removeValue(value)}
                className="rounded text-zinc-500 transition hover:text-red-400"
                aria-label={`Remove ${value}`}
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>

        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center"
          onSubmit={(e) => {
            e.preventDefault();
            addValue();
          }}
        >
          <Label htmlFor="value-input" className="sr-only">
            Add a value
          </Label>
          <Input
            id="value-input"
            value={valueDraft}
            onChange={(e) => setValueDraft(e.target.value)}
            placeholder="e.g. Agency, Craft, Courage…"
            className="sm:max-w-xs"
            maxLength={40}
          />
          <Button type="submit" variant="secondary" disabled={!valueDraft.trim()}>
            <Plus />
            Add
          </Button>
        </form>
      </motion.section>

      {/* Vision statement */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
        className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-zinc-900/40 to-zinc-950 p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-zinc-50">
              Vision statement
            </h2>
            <p className="mt-1 max-w-md text-sm text-zinc-500">
              One paragraph. Clear enough to rearrange your week around.
            </p>
          </div>
          <Button
            variant="accent"
            onClick={handleGenerate}
            disabled={generating}
          >
            <Wand2 className={generating ? "animate-pulse" : undefined} />
            {generating ? "Generating…" : "Generate vision"}
          </Button>
        </div>

        <Textarea
          value={canvas.visionStatement}
          onChange={(e) => updateVision(e.target.value)}
          placeholder="Fill the quadrants (and a value or two), then hit Generate — or write your own."
          className="mt-5 min-h-[160px] border-zinc-800 bg-zinc-950/60 font-display text-base leading-relaxed text-zinc-100"
          aria-label="Vision statement"
        />
        <p className="mt-3 text-xs text-zinc-600">
          Tip: edit freely after generating. Purpose is a hypothesis — test it.
        </p>
      </motion.section>
    </div>
  );
}
