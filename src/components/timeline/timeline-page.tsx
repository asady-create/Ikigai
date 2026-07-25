"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, Check, Plus, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { useIkigai } from "@/components/providers/ikigai-provider";
import type { TimelineArea, TimelineEvent } from "@/lib/types";
import { TIMELINE_AREAS } from "@/lib/types";
import {
  AREA_META,
  buildMonthSpine,
  monthKeyFromDate,
  sortTimeline,
} from "@/lib/timeline";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function TimelinePage() {
  const { ready, timeline, setTimeline } = useIkigai();
  const [date, setDate] = useState(todayISO);
  const [title, setTitle] = useState("");
  const [area, setArea] = useState<TimelineArea>("offer");
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState<TimelineArea | "all">("all");
  const [savedFlash, setSavedFlash] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const months = useMemo(() => buildMonthSpine(3), []);
  const sorted = useMemo(() => sortTimeline(timeline), [timeline]);

  const filtered = useMemo(
    () =>
      filter === "all" ? sorted : sorted.filter((e) => e.area === filter),
    [sorted, filter]
  );

  const byMonth = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    for (const m of months) map.set(m.key, []);
    for (const e of filtered) {
      const key = monthKeyFromDate(e.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [months, filtered]);

  const persist = (next: TimelineEvent[]) => {
    setTimeline(next);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1000);
  };

  const addEvent = () => {
    const t = title.trim();
    if (!t || !date) return;
    const event: TimelineEvent = {
      id: nanoid(10),
      date,
      title: t,
      area,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };
    persist([...timeline, event]);
    setTitle("");
    setNote("");
    setSelectedId(event.id);
  };

  const removeEvent = (id: string) => {
    persist(timeline.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const selected = sorted.find((e) => e.id === selectedId) ?? null;

  if (!ready) {
    return (
      <div className="animate-pulse space-y-4 py-8">
        <div className="h-8 w-40 rounded bg-[var(--surface-2)]" />
        <div className="h-64 rounded-xl bg-[var(--surface-2)]" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
            Timeline
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Chronology
          </h1>
          <p className="mt-2 max-w-lg text-sm text-[var(--muted)]">
            From January 2025 downward. Each event is a short colored line —
            color marks which area changed.
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

      {/* Color legend + filter */}
      <section className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium transition",
              filter === "all"
                ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                : "border-[var(--border)] text-[var(--muted)]"
            )}
          >
            All
          </button>
          {TIMELINE_AREAS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setFilter((prev) => (prev === a ? "all" : a))}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition",
                filter === a
                  ? "border-transparent text-white"
                  : "border-[var(--border)] bg-[var(--surface)]"
              )}
              style={
                filter === a
                  ? { backgroundColor: AREA_META[a].color }
                  : { color: AREA_META[a].color }
              }
            >
              <span
                className="inline-block h-0.5 w-4 rounded-full"
                style={{ backgroundColor: AREA_META[a].color }}
              />
              {AREA_META[a].label}
            </button>
          ))}
        </div>
      </section>

      {/* Add event */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
        <h2 className="font-display text-sm font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
          Add event
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="tl-date">
              Date
            </label>
            <Input
              id="tl-date"
              type="date"
              min="2025-01-01"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="tl-area">
              Area
            </label>
            <select
              id="tl-area"
              value={area}
              onChange={(e) => setArea(e.target.value as TimelineArea)}
              className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30"
            >
              {TIMELINE_AREAS.map((a) => (
                <option key={a} value={a}>
                  {AREA_META[a].label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="tl-title">
            Event
          </label>
          <Input
            id="tl-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short label for the change…"
            maxLength={120}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                addEvent();
              }
            }}
          />
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="tl-note">
            Note (optional)
          </label>
          <Textarea
            id="tl-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What shifted?"
            className="min-h-[72px]"
          />
        </div>
        <Button
          className="mt-3"
          variant="accent"
          onClick={addEvent}
          disabled={!title.trim() || !date}
        >
          <Plus />
          Add to timeline
        </Button>
      </section>

      {/* Vertical timeline */}
      <section className="relative">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
          <span>Jan 2025</span>
          <ArrowDown className="size-3.5 text-[var(--accent)]" />
          <span>now</span>
        </div>

        <div className="relative pl-4 sm:pl-6">
          {/* Vertical axis + arrow tip */}
          <div
            aria-hidden
            className="absolute top-0 bottom-8 left-[7px] w-px bg-[var(--border)] sm:left-[11px]"
          />
          <div
            aria-hidden
            className="absolute bottom-0 left-[1px] text-[var(--accent)] sm:left-[5px]"
          >
            <ArrowDown className="size-4" strokeWidth={2.25} />
          </div>

          <ul className="space-y-0 pb-10">
            {months.map((m, i) => {
              const events = byMonth.get(m.key) ?? [];
              return (
                <motion.li
                  key={m.key}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.015, 0.3) }}
                  className="relative pb-6"
                >
                  {/* Month tick on the axis */}
                  <span
                    aria-hidden
                    className="absolute top-1.5 left-[-1px] size-2.5 rounded-full border-2 border-[var(--accent)] bg-[var(--background)] sm:left-[3px]"
                  />

                  <div className="ml-5 sm:ml-6">
                    <p className="font-display text-sm font-semibold text-[var(--foreground)]">
                      {m.label}
                    </p>

                    {events.length === 0 ? (
                      <p className="mt-1 text-xs text-[var(--muted)]/70">—</p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {events.map((event) => {
                          const meta = AREA_META[event.area];
                          const active = selectedId === event.id;
                          return (
                            <li key={event.id}>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedId((id) =>
                                    id === event.id ? null : event.id
                                  )
                                }
                                className={cn(
                                  "group flex w-full items-center gap-3 rounded-md py-1 text-left transition",
                                  active && "bg-[var(--accent-soft)]/50"
                                )}
                              >
                                {/* Short horizontal colored line */}
                                <span
                                  className="h-[3px] w-10 shrink-0 rounded-full sm:w-14"
                                  style={{ backgroundColor: meta.color }}
                                  title={meta.label}
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-medium text-[var(--foreground)]">
                                    {event.title}
                                  </span>
                                  <span className="text-[10px] text-[var(--muted)]">
                                    {event.date} · {meta.label}
                                  </span>
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Selected event detail */}
      <AnimatePresence>
        {selected && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-[3px] w-10 rounded-full"
                    style={{ backgroundColor: AREA_META[selected.area].color }}
                  />
                  <p className="text-xs font-medium" style={{ color: AREA_META[selected.area].color }}>
                    {AREA_META[selected.area].label}
                  </p>
                </div>
                <h3 className="mt-2 font-display text-lg font-semibold text-[var(--foreground)]">
                  {selected.title}
                </h3>
                <p className="mt-1 text-xs text-[var(--muted)]">{selected.date}</p>
              </div>
              <button
                type="button"
                onClick={() => removeEvent(selected.id)}
                className="rounded p-1.5 text-[var(--muted)] transition hover:text-red-600"
                aria-label="Delete event"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            {selected.note ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]">
                {selected.note}
              </p>
            ) : (
              <p className="mt-3 text-sm text-[var(--muted)]">No note.</p>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
