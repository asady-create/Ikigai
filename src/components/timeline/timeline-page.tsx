"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { nanoid } from "nanoid";
import { useIkigai } from "@/components/providers/ikigai-provider";
import type { TimelineAreaDef, TimelineEvent } from "@/lib/types";
import {
  AREA_COLOR_PRESETS,
  buildMonthSpine,
  daysInMonth,
  findArea,
  formatDisplayDate,
  formatShortDate,
  monthKeyFromDate,
  monthOptions,
  parseISODate,
  sortTimeline,
  toISODate,
  yearOptions,
} from "@/lib/timeline";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const selectClass =
  "flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30";

/** Year / Month / Day selects with a clear readable date readout. */
function ClearDatePicker({
  value,
  onChange,
  idPrefix = "date",
}: {
  value: string;
  onChange: (iso: string) => void;
  idPrefix?: string;
}) {
  const parts = parseISODate(value || todayISO());
  const years = yearOptions();
  const months = monthOptions();
  const dim = daysInMonth(parts.year, parts.month);
  const day = Math.min(parts.day, dim);
  const days = Array.from({ length: dim }, (_, i) => i + 1);

  const setPart = (next: { year?: number; month?: number; day?: number }) => {
    const y = next.year ?? parts.year;
    const m = next.month ?? parts.month;
    const d = next.day ?? day;
    onChange(toISODate(y, m, d));
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label
            className="mb-1 block text-xs text-[var(--muted)]"
            htmlFor={`${idPrefix}-day`}
          >
            Day
          </label>
          <select
            id={`${idPrefix}-day`}
            className={selectClass}
            value={day}
            onChange={(e) => setPart({ day: Number(e.target.value) })}
          >
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="mb-1 block text-xs text-[var(--muted)]"
            htmlFor={`${idPrefix}-month`}
          >
            Month
          </label>
          <select
            id={`${idPrefix}-month`}
            className={selectClass}
            value={parts.month}
            onChange={(e) => setPart({ month: Number(e.target.value) })}
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="mb-1 block text-xs text-[var(--muted)]"
            htmlFor={`${idPrefix}-year`}
          >
            Year
          </label>
          <select
            id={`${idPrefix}-year`}
            className={selectClass}
            value={parts.year}
            onChange={(e) => setPart({ year: Number(e.target.value) })}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-sm text-[var(--foreground)]">
        <span className="text-[var(--muted)]">Selected: </span>
        <span className="font-medium">
          {formatDisplayDate(toISODate(parts.year, parts.month, day))}
        </span>
      </p>
    </div>
  );
}

export function TimelinePage() {
  const {
    ready,
    timeline,
    timelineAreas,
    setTimeline,
    setTimelineAreas,
  } = useIkigai();

  const [date, setDate] = useState(todayISO);
  const [title, setTitle] = useState("");
  const [areaId, setAreaId] = useState("offer");
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState<string | "all">("all");
  const [savedFlash, setSavedFlash] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  // Area manager
  const [showAreas, setShowAreas] = useState(false);
  const [newAreaLabel, setNewAreaLabel] = useState("");
  const [newAreaColor, setNewAreaColor] = useState(AREA_COLOR_PRESETS[0]);
  const [editAreaId, setEditAreaId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editColor, setEditColor] = useState("");

  // Keep selected area valid when areas change
  useEffect(() => {
    if (!timelineAreas.some((a) => a.id === areaId) && timelineAreas[0]) {
      setAreaId(timelineAreas[0].id);
    }
  }, [timelineAreas, areaId]);

  const months = useMemo(() => buildMonthSpine(3), []);
  const sorted = useMemo(() => sortTimeline(timeline), [timeline]);

  const filtered = useMemo(
    () =>
      filter === "all" ? sorted : sorted.filter((e) => e.areaId === filter),
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

  const flash = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1000);
  };

  const persistEvents = (next: TimelineEvent[]) => {
    setTimeline(next);
    flash();
  };

  const persistAreas = (next: TimelineAreaDef[]) => {
    setTimelineAreas(next);
    flash();
  };

  const addEvent = () => {
    const t = title.trim();
    if (!t || !date) return;
    const event: TimelineEvent = {
      id: nanoid(10),
      date,
      title: t,
      areaId,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };
    persistEvents([...timeline, event]);
    setTitle("");
    setNote("");
    setSelectedId(event.id);
    setEditing(false);
  };

  const removeEvent = (id: string) => {
    persistEvents(timeline.filter((e) => e.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setEditing(false);
    }
  };

  const updateSelected = (patch: Partial<TimelineEvent>) => {
    if (!selectedId) return;
    persistEvents(
      timeline.map((e) => (e.id === selectedId ? { ...e, ...patch } : e))
    );
  };

  const addArea = () => {
    const label = newAreaLabel.trim();
    if (!label) return;
    const area: TimelineAreaDef = {
      id: nanoid(8),
      label,
      color: newAreaColor,
    };
    persistAreas([...timelineAreas, area]);
    setNewAreaLabel("");
    setAreaId(area.id);
  };

  const startEditArea = (a: TimelineAreaDef) => {
    setEditAreaId(a.id);
    setEditLabel(a.label);
    setEditColor(a.color);
  };

  const saveEditArea = () => {
    if (!editAreaId) return;
    const label = editLabel.trim();
    if (!label) return;
    persistAreas(
      timelineAreas.map((a) =>
        a.id === editAreaId ? { ...a, label, color: editColor } : a
      )
    );
    setEditAreaId(null);
  };

  const removeArea = (id: string) => {
    if (timelineAreas.length <= 1) return;
    persistAreas(timelineAreas.filter((a) => a.id !== id));
    if (filter === id) setFilter("all");
    if (areaId === id && timelineAreas[0]) {
      const next = timelineAreas.find((a) => a.id !== id);
      if (next) setAreaId(next.id);
    }
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
            From January 2025 downward. Colored lines mark which area changed.
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

      {/* Areas: filter + manage */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
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
            {timelineAreas.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() =>
                  setFilter((prev) => (prev === a.id ? "all" : a.id))
                }
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition",
                  filter === a.id
                    ? "border-transparent text-white"
                    : "border-[var(--border)] bg-[var(--surface)]"
                )}
                style={
                  filter === a.id
                    ? { backgroundColor: a.color }
                    : { color: a.color }
                }
              >
                <span
                  className="inline-block h-0.5 w-4 rounded-full"
                  style={{ backgroundColor: a.color }}
                />
                {a.label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowAreas((v) => !v)}
          >
            <Pencil className="size-3.5" />
            {showAreas ? "Hide areas" : "Edit areas"}
          </Button>
        </div>

        <AnimatePresence>
          {showAreas && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <h2 className="font-display text-sm font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
                  Areas
                </h2>
                <ul className="mt-3 space-y-2">
                  {timelineAreas.map((a) => (
                    <li
                      key={a.id}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                    >
                      {editAreaId === a.id ? (
                        <>
                          <input
                            type="color"
                            value={editColor}
                            onChange={(e) => setEditColor(e.target.value)}
                            className="h-8 w-10 cursor-pointer rounded border border-[var(--border)] bg-transparent"
                            aria-label="Color"
                          />
                          <Input
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            className="h-8 flex-1"
                            aria-label="Area name"
                          />
                          <Button size="sm" variant="accent" onClick={saveEditArea}>
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditAreaId(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <span
                            className="inline-block h-[3px] w-8 rounded-full"
                            style={{ backgroundColor: a.color }}
                          />
                          <span className="min-w-0 flex-1 text-sm font-medium text-[var(--foreground)]">
                            {a.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => startEditArea(a)}
                            className="rounded p-1.5 text-[var(--muted)] hover:text-[var(--foreground)]"
                            aria-label={`Edit ${a.label}`}
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeArea(a.id)}
                            disabled={timelineAreas.length <= 1}
                            className="rounded p-1.5 text-[var(--muted)] hover:text-red-600 disabled:opacity-30"
                            aria-label={`Remove ${a.label}`}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-[var(--muted)]">
                      New area
                    </label>
                    <Input
                      value={newAreaLabel}
                      onChange={(e) => setNewAreaLabel(e.target.value)}
                      placeholder="e.g. Health, Family…"
                      maxLength={40}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[var(--muted)]">
                      Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newAreaColor}
                        onChange={(e) => setNewAreaColor(e.target.value)}
                        className="h-10 w-12 cursor-pointer rounded border border-[var(--border)] bg-transparent"
                      />
                      <div className="flex flex-wrap gap-1">
                        {AREA_COLOR_PRESETS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewAreaColor(c)}
                            className={cn(
                              "size-5 rounded-full border",
                              newAreaColor === c
                                ? "border-[var(--foreground)]"
                                : "border-transparent"
                            )}
                            style={{ backgroundColor: c }}
                            aria-label={`Pick ${c}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={addArea}
                    disabled={!newAreaLabel.trim()}
                  >
                    <Plus />
                    Add area
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Add event */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
        <h2 className="font-display text-sm font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
          Add event
        </h2>
        <div className="mt-3">
          <p className="mb-1 text-xs text-[var(--muted)]">Date</p>
          <ClearDatePicker value={date} onChange={setDate} idPrefix="add" />
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="tl-area">
            Area
          </label>
          <select
            id="tl-area"
            value={areaId}
            onChange={(e) => setAreaId(e.target.value)}
            className={selectClass}
          >
            {timelineAreas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
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
          <span>January 2025</span>
          <ArrowDown className="size-3.5 text-[var(--accent)]" />
          <span>now</span>
        </div>

        <div className="relative pl-4 sm:pl-6">
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
                          const meta = findArea(timelineAreas, event.areaId);
                          const active = selectedId === event.id;
                          return (
                            <li key={event.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedId((id) =>
                                    id === event.id ? null : event.id
                                  );
                                  setEditing(false);
                                }}
                                className={cn(
                                  "group flex w-full items-center gap-3 rounded-md py-1 text-left transition",
                                  active && "bg-[var(--accent-soft)]/50"
                                )}
                              >
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
                                    {formatShortDate(event.date)} · {meta.label}
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

      {/* Selected event detail / edit */}
      <AnimatePresence>
        {selected && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {editing ? (
                  <div className="space-y-3">
                    <ClearDatePicker
                      value={selected.date}
                      onChange={(iso) => updateSelected({ date: iso })}
                      idPrefix="edit"
                    />
                    <div>
                      <label className="mb-1 block text-xs text-[var(--muted)]">
                        Area
                      </label>
                      <select
                        className={selectClass}
                        value={selected.areaId}
                        onChange={(e) =>
                          updateSelected({ areaId: e.target.value })
                        }
                      >
                        {timelineAreas.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Input
                      value={selected.title}
                      onChange={(e) => updateSelected({ title: e.target.value })}
                      aria-label="Event title"
                    />
                    <Textarea
                      value={selected.note}
                      onChange={(e) => updateSelected({ note: e.target.value })}
                      placeholder="Note…"
                      className="min-h-[80px]"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditing(false)}
                    >
                      Done
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-[3px] w-10 rounded-full"
                        style={{
                          backgroundColor: findArea(
                            timelineAreas,
                            selected.areaId
                          ).color,
                        }}
                      />
                      <p
                        className="text-xs font-medium"
                        style={{
                          color: findArea(timelineAreas, selected.areaId).color,
                        }}
                      >
                        {findArea(timelineAreas, selected.areaId).label}
                      </p>
                    </div>
                    <h3 className="mt-2 font-display text-lg font-semibold text-[var(--foreground)]">
                      {selected.title}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {formatDisplayDate(selected.date)}
                    </p>
                    {selected.note ? (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]">
                        {selected.note}
                      </p>
                    ) : (
                      <p className="mt-3 text-sm text-[var(--muted)]">No note.</p>
                    )}
                  </>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                {!editing && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="rounded p-1.5 text-[var(--muted)] transition hover:text-[var(--foreground)]"
                    aria-label="Edit event"
                  >
                    <Pencil className="size-4" />
                  </button>
                )}
                {editing && (
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="rounded p-1.5 text-[var(--muted)] transition hover:text-[var(--foreground)]"
                    aria-label="Close editor"
                  >
                    <X className="size-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeEvent(selected.id)}
                  className="rounded p-1.5 text-[var(--muted)] transition hover:text-red-600"
                  aria-label="Delete event"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
