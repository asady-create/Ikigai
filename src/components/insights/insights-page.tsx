"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { nanoid } from "nanoid";
import { ArrowRight, Plus, RefreshCw, Trash2, Wand2 } from "lucide-react";
import { useIkigai } from "@/components/providers/ikigai-provider";
import {
  INSIGHT_CONNECTIONS,
  generateInsightIdeas,
  mergeAutoInsights,
} from "@/lib/insights";
import type { InsightConnectionId, InsightIdea } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function InsightsPage() {
  const { ready, data, insights, setInsights } = useIkigai();
  const map = data.map;
  const [draftByConn, setDraftByConn] = useState<
    Partial<Record<InsightConnectionId, string>>
  >({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const ideasByConnection = useMemo(() => {
    const grouped: Record<InsightConnectionId, InsightIdea[]> = {
      "want-need": [],
      "offer-need": [],
      "offer-reward": [],
      "have-need": [],
      "want-gap": [],
    };
    for (const idea of insights) {
      if (grouped[idea.connectionId]) {
        grouped[idea.connectionId].push(idea);
      }
    }
    return grouped;
  }, [insights]);

  const readyCount = INSIGHT_CONNECTIONS.filter((c) => c.ready(map)).length;

  const regenerate = () => {
    const generated = generateInsightIdeas(map, 5);
    setInsights(mergeAutoInsights(insights, generated));
  };

  const addManual = (connectionId: InsightConnectionId) => {
    const text = (draftByConn[connectionId] ?? "").trim();
    if (!text) return;
    const idea: InsightIdea = {
      id: nanoid(10),
      connectionId,
      text,
      source: "manual",
      createdAt: new Date().toISOString(),
    };
    setInsights([idea, ...insights]);
    setDraftByConn((prev) => ({ ...prev, [connectionId]: "" }));
  };

  const removeIdea = (id: string) => {
    setInsights(insights.filter((i) => i.id !== id));
  };

  const startEdit = (idea: InsightIdea) => {
    setEditingId(idea.id);
    setEditText(idea.text);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const text = editText.trim();
    if (!text) return;
    setInsights(
      insights.map((i) =>
        i.id === editingId ? { ...i, text, source: "manual" as const } : i
      )
    );
    setEditingId(null);
    setEditText("");
  };

  if (!ready) {
    return (
      <div className="animate-pulse space-y-4 py-8">
        <div className="h-8 w-36 rounded bg-[var(--surface-2)]" />
        <div className="h-40 rounded-xl bg-[var(--surface-2)]" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
            Insights
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Connection view
          </h1>
          <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
            Overlaps between map answers. Generate 3–5 ideas, or write your own.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="accent"
            onClick={regenerate}
            disabled={readyCount === 0}
          >
            <Wand2 />
            {insights.some((i) => i.source === "auto")
              ? "Refresh auto ideas"
              : "Generate ideas"}
          </Button>
          {insights.some((i) => i.source === "auto") && (
            <Button
              variant="secondary"
              onClick={() =>
                setInsights(insights.filter((i) => i.source === "manual"))
              }
            >
              <RefreshCw />
              Clear auto
            </Button>
          )}
        </div>
      </header>

      {readyCount === 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-5 text-sm text-[var(--muted)]">
          Fill at least two related Map fields to unlock overlaps.{" "}
          <Link
            href="/map"
            className="inline-flex items-center gap-1 font-medium text-[var(--accent)] hover:underline"
          >
            Open map
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}

      <div className="space-y-8">
        {INSIGHT_CONNECTIONS.map((conn, i) => {
          const readyConn = conn.ready(map);
          const ideas = ideasByConnection[conn.id];
          return (
            <motion.section
              key={conn.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                "rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5",
                !readyConn && "opacity-60"
              )}
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
                  {conn.formula}
                </h2>
                <span className="text-sm text-[var(--muted)]">=</span>
                <span className="text-sm font-medium text-[var(--accent)]">
                  {conn.result}
                </span>
              </div>
              {!readyConn && (
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Needs both sides filled on the Map / Skills pages.
                </p>
              )}

              <ul className="mt-4 space-y-2">
                <AnimatePresence initial={false}>
                  {ideas.length === 0 && readyConn && (
                    <li className="text-sm text-[var(--muted)]">
                      No ideas yet — generate or add one below.
                    </li>
                  )}
                  {ideas.map((idea) => (
                    <motion.li
                      key={idea.id}
                      layout
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="group rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5"
                    >
                      {editingId === idea.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="min-h-[72px]"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button size="sm" variant="accent" onClick={saveEdit}>
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingId(null);
                                setEditText("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(idea)}
                            className="min-w-0 flex-1 text-left text-sm leading-relaxed text-[var(--foreground)]"
                          >
                            {idea.text}
                            <span className="mt-1 block text-[10px] tracking-wide text-[var(--muted)] uppercase">
                              {idea.source}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeIdea(idea.id)}
                            className="shrink-0 rounded p-1 text-[var(--muted)] opacity-60 transition hover:text-red-600 group-hover:opacity-100"
                            aria-label="Remove idea"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>

              <form
                className="mt-4 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  addManual(conn.id);
                }}
              >
                <Input
                  value={draftByConn[conn.id] ?? ""}
                  onChange={(e) =>
                    setDraftByConn((prev) => ({
                      ...prev,
                      [conn.id]: e.target.value,
                    }))
                  }
                  placeholder={`Add a ${conn.result.toLowerCase()} idea…`}
                />
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={!(draftByConn[conn.id] ?? "").trim()}
                >
                  <Plus />
                  Add
                </Button>
              </form>
            </motion.section>
          );
        })}
      </div>
    </div>
  );
}
