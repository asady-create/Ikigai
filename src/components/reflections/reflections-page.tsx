"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { nanoid } from "nanoid";
import {
  Sparkles,
  Shuffle,
  Download,
  Trash2,
  Save,
  ChevronRight,
  Brain,
  Loader2,
} from "lucide-react";
import {
  PROMPTS,
  THEME_LABELS,
  THEME_ORDER,
  getDailyPrompt,
  getPromptById,
  getRandomPrompt,
} from "@/lib/prompts";
import { getRotatingQuote } from "@/lib/quotes";
import { analyzeReflections } from "@/lib/ai-placeholder";
import { downloadMarkdown } from "@/lib/storage";
import { formatDisplayDate } from "@/lib/utils";
import type { InsightResult, ReflectionEntry, ReflectionPrompt } from "@/lib/types";
import { useIkigai } from "@/components/providers/ikigai-provider";
import { QuoteBlock } from "@/components/shared/quote-block";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge, Label, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function RatingSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex-1 space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="font-display text-lg font-semibold text-amber-400">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-amber-500"
      />
      <div className="flex justify-between text-[10px] uppercase tracking-wider text-zinc-600">
        <span>Low</span>
        <span>Max</span>
      </div>
    </div>
  );
}

function MarkdownHints() {
  return (
    <p className="text-xs text-zinc-600">
      Markdown supported: **bold**, *italic*, lists, headings.
    </p>
  );
}

export function ReflectionsPage() {
  const searchParams = useSearchParams();
  const { reflections, upsertReflection, removeReflection, setInsights, data } =
    useIkigai();

  const daily = useMemo(() => getDailyPrompt(), []);
  const quote = useMemo(() => getRotatingQuote(1), []);

  const [activePrompt, setActivePrompt] = useState<ReflectionPrompt>(daily);
  const [content, setContent] = useState("");
  const [energy, setEnergy] = useState(7);
  const [clarity, setClarity] = useState(6);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [themeFilter, setThemeFilter] = useState<string>("all");
  const [savedFlash, setSavedFlash] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setLocalInsights] = useState<InsightResult | null>(
    data.insights
  );
  const [view, setView] = useState<"write" | "library" | "journal">("write");

  // Deep-link ?prompt=id
  useEffect(() => {
    const id = searchParams.get("prompt");
    if (id) {
      const p = getPromptById(id);
      if (p) {
        setActivePrompt(p);
        setView("write");
      }
    }
  }, [searchParams]);

  useEffect(() => {
    setLocalInsights(data.insights);
  }, [data.insights]);

  const filteredPrompts = useMemo(() => {
    if (themeFilter === "all") return PROMPTS;
    return PROMPTS.filter((p) => p.theme === themeFilter);
  }, [themeFilter]);

  const loadEntry = useCallback((entry: ReflectionEntry) => {
    setEditingId(entry.id);
    setContent(entry.content);
    setEnergy(entry.energy);
    setClarity(entry.clarity);
    setActivePrompt({
      id: entry.promptId,
      theme: entry.theme,
      title: entry.promptText.slice(0, 80),
      prompt: entry.promptText,
    });
    setView("write");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const startFresh = useCallback((prompt: ReflectionPrompt) => {
    setEditingId(null);
    setContent("");
    setEnergy(7);
    setClarity(6);
    setActivePrompt(prompt);
    setView("write");
  }, []);

  const handleSave = () => {
    const now = new Date().toISOString();
    const entry: ReflectionEntry = {
      id: editingId ?? nanoid(),
      promptId: activePrompt.id,
      promptText: activePrompt.prompt,
      theme: activePrompt.theme,
      content: content.trim(),
      energy,
      clarity,
      createdAt: editingId
        ? reflections.find((r) => r.id === editingId)?.createdAt ?? now
        : now,
      updatedAt: now,
    };
    upsertReflection(entry);
    setEditingId(entry.id);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await analyzeReflections(reflections);
      setInsights(result);
      setLocalInsights(result);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500/90">
          Reflections
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
          Write with intensity.
          <span className="block text-zinc-500">Act on what you learn.</span>
        </h1>
        <div className="max-w-2xl">
          <QuoteBlock quote={quote} />
        </div>
      </header>

      {/* View tabs */}
      <div className="flex flex-wrap gap-2 print:hidden">
        {(
          [
            ["write", "Write"],
            ["library", "Prompt library"],
            ["journal", "Journal"],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            variant={view === key ? "default" : "outline"}
            size="sm"
            onClick={() => setView(key)}
          >
            {label}
          </Button>
        ))}
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadMarkdown()}
            disabled={!reflections.length}
          >
            <Download />
            Export MD
          </Button>
          <Button
            variant="accent"
            size="sm"
            onClick={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? <Loader2 className="animate-spin" /> : <Brain />}
            Analyze my reflections
          </Button>
        </div>
      </div>

      {/* Insights panel */}
      <AnimatePresence>
        {insights && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0 }}
            className="overflow-hidden print:hidden"
          >
            <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-amber-400" />
                  <CardTitle>Insights</CardTitle>
                </div>
                <CardDescription>
                  Placeholder analysis — wire to OpenAI/Claude when ready. Generated{" "}
                  {formatDisplayDate(insights.generatedAt)}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-zinc-200">{insights.summary}</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <InsightList title="Patterns" items={insights.patterns} />
                  <InsightList
                    title="Opportunities"
                    items={insights.opportunities}
                  />
                  <InsightList title="Action steps" items={insights.actionSteps} />
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}
      </AnimatePresence>

      {view === "write" && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 lg:grid-cols-[1fr_280px]"
        >
          <div className="space-y-5">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-amber-500/30 text-amber-400">
                  {THEME_LABELS[activePrompt.theme]}
                </Badge>
                {activePrompt.id === daily.id && (
                  <Badge className="border-zinc-600">Today&apos;s pick</Badge>
                )}
                {editingId && (
                  <Badge className="border-zinc-600">Editing</Badge>
                )}
              </div>
              <h2 className="mt-3 font-display text-xl font-semibold text-zinc-50 sm:text-2xl">
                {activePrompt.title}
              </h2>
              <p className="mt-2 text-zinc-400">{activePrompt.prompt}</p>
              {activePrompt.nudge && (
                <p className="mt-3 text-sm italic text-amber-500/70">
                  {activePrompt.nudge}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="journal">Your response</Label>
              <Textarea
                id="journal"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write with maximum energy. No hedging. No corporate speak."
                className="min-h-[240px] font-mono text-[13px] leading-relaxed sm:min-h-[300px]"
              />
              <MarkdownHints />
            </div>

            <div className="flex flex-col gap-6 rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 sm:flex-row">
              <RatingSlider
                label="Energy right now"
                value={energy}
                onChange={setEnergy}
              />
              <RatingSlider
                label="Clarity right now"
                value={clarity}
                onChange={setClarity}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSave} variant="accent" size="lg">
                <Save />
                {savedFlash ? "Saved" : editingId ? "Update reflection" : "Save reflection"}
              </Button>
              <Button
                variant="outline"
                onClick={() => startFresh(getRandomPrompt(activePrompt.id))}
              >
                <Shuffle />
                Shuffle prompt
              </Button>
              <Button variant="ghost" onClick={() => startFresh(daily)}>
                Today&apos;s prompt
              </Button>
            </div>
          </div>

          <aside className="space-y-4 print:hidden">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Quick pick
            </p>
            <ul className="space-y-2">
              {[daily, ...PROMPTS.filter((p) => p.id !== daily.id).slice(0, 5)].map(
                (p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => startFresh(p)}
                      className={cn(
                        "w-full rounded-lg border px-3 py-2.5 text-left transition",
                        p.id === activePrompt.id
                          ? "border-amber-500/40 bg-amber-500/5"
                          : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"
                      )}
                    >
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                        {THEME_LABELS[p.theme]}
                      </span>
                      <span className="mt-0.5 block text-sm font-medium text-zinc-200">
                        {p.title}
                      </span>
                    </button>
                  </li>
                )
              )}
            </ul>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setView("library")}
            >
              Browse full library
              <ChevronRight />
            </Button>
          </aside>
        </motion.section>
      )}

      {view === "library" && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={themeFilter === "all" ? "default" : "outline"}
              onClick={() => setThemeFilter("all")}
            >
              All
            </Button>
            {THEME_ORDER.map((t) => (
              <Button
                key={t}
                size="sm"
                variant={themeFilter === t ? "default" : "outline"}
                onClick={() => setThemeFilter(t)}
              >
                {THEME_LABELS[t]}
              </Button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredPrompts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => startFresh(p)}
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 text-left transition hover:border-zinc-600 hover:bg-zinc-900/70"
              >
                <Badge>{THEME_LABELS[p.theme]}</Badge>
                <h3 className="mt-2 font-display text-lg font-semibold text-zinc-100">
                  {p.title}
                </h3>
                <p className="mt-1 line-clamp-3 text-sm text-zinc-400">
                  {p.prompt}
                </p>
              </button>
            ))}
          </div>
        </motion.section>
      )}

      {view === "journal" && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
          id="journal-print"
        >
          {!reflections.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Empty journal</CardTitle>
                <CardDescription>
                  Clarity starts with writing. Pick a prompt and ship one honest
                  paragraph.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="accent" onClick={() => startFresh(daily)}>
                  Start today&apos;s prompt
                </Button>
              </CardContent>
            </Card>
          ) : (
            reflections.map((entry) => (
              <article
                key={entry.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Badge>{THEME_LABELS[entry.theme]}</Badge>
                    <p className="mt-2 text-sm text-zinc-500">
                      {formatDisplayDate(entry.createdAt)} · Energy{" "}
                      {entry.energy}/10 · Clarity {entry.clarity}/10
                    </p>
                  </div>
                  <div className="flex gap-1 print:hidden">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => loadEntry(entry)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (
                          confirm(
                            "Delete this reflection? This cannot be undone."
                          )
                        ) {
                          removeReflection(entry.id);
                        }
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium text-zinc-300">
                  {entry.promptText}
                </p>
                <div className="mt-4 whitespace-pre-wrap font-mono text-sm leading-relaxed text-zinc-200">
                  {entry.content || "_(empty)_"}
                </div>
              </article>
            ))
          )}
        </motion.section>
      )}
    </div>
  );
}

function InsightList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {title}
      </h3>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li
            key={item.slice(0, 40)}
            className="border-l-2 border-zinc-700 pl-3 text-sm text-zinc-300"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
