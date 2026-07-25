import type { TimelineAreaDef, TimelineEvent } from "./types";

export const TIMELINE_START = { year: 2025, month: 1 }; // January 2025

/** Seed areas — users can rename, recolor, add, or remove. */
export const DEFAULT_TIMELINE_AREAS: TimelineAreaDef[] = [
  { id: "love", label: "Love / want", color: "#0d5c63" },
  { id: "goodAt", label: "Good at", color: "#256378" },
  { id: "need", label: "World needs", color: "#475569" },
  { id: "reward", label: "Paid for", color: "#0f766e" },
  { id: "offer", label: "Deliver", color: "#b45309" },
  { id: "skills", label: "Skills", color: "#7c3aed" },
  { id: "values", label: "Values", color: "#be123c" },
  { id: "other", label: "Other", color: "#78716c" },
];

export const AREA_COLOR_PRESETS = [
  "#0d5c63",
  "#256378",
  "#475569",
  "#0f766e",
  "#b45309",
  "#7c3aed",
  "#be123c",
  "#78716c",
  "#0369a1",
  "#15803d",
  "#a16207",
  "#c2410c",
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function normalizeTimelineAreas(
  raw: Partial<TimelineAreaDef>[] | undefined | null
): TimelineAreaDef[] {
  if (!raw || raw.length === 0) {
    return DEFAULT_TIMELINE_AREAS.map((a) => ({ ...a }));
  }
  const cleaned = raw
    .filter((a) => a && a.id)
    .map((a) => ({
      id: String(a.id),
      label: (a.label ?? "Untitled").trim() || "Untitled",
      color: a.color && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(a.color)
        ? a.color
        : "#78716c",
    }));
  return cleaned.length > 0
    ? cleaned
    : DEFAULT_TIMELINE_AREAS.map((a) => ({ ...a }));
}

export function normalizeTimelineEvent(
  raw: Partial<TimelineEvent> & { id: string } & { area?: string },
  areas: TimelineAreaDef[]
): TimelineEvent {
  const areaIds = new Set(areas.map((a) => a.id));
  // Migrate legacy `area` field → areaId
  const legacy = (raw as { area?: string }).area;
  let areaId = raw.areaId || legacy || "other";
  if (!areaIds.has(areaId)) {
    areaId = areas[0]?.id ?? "other";
  }
  return {
    id: raw.id,
    date: raw.date || new Date().toISOString().slice(0, 10),
    title: raw.title ?? "",
    areaId,
    note: raw.note ?? "",
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

export function findArea(
  areas: TimelineAreaDef[],
  areaId: string
): TimelineAreaDef {
  return (
    areas.find((a) => a.id === areaId) ?? {
      id: areaId,
      label: "Unknown",
      color: "#78716c",
    }
  );
}

/** Parse YYYY-MM-DD into parts (local-safe). */
export function parseISODate(iso: string): {
  year: number;
  month: number;
  day: number;
} {
  const [y, m, d] = iso.split("-").map(Number);
  return {
    year: y || TIMELINE_START.year,
    month: m || 1,
    day: d || 1,
  };
}

export function toISODate(year: number, month: number, day: number): string {
  const dim = daysInMonth(year, month);
  const safeDay = Math.min(Math.max(1, day), dim);
  return `${year}-${String(month).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Clear human date: "15 January 2025" */
export function formatDisplayDate(iso: string): string {
  const { year, month, day } = parseISODate(iso);
  if (!year || !month || !day) return iso;
  return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

/** Shorter: "15 Jan 2025" */
export function formatShortDate(iso: string): string {
  const { year, month, day } = parseISODate(iso);
  if (!year || !month || !day) return iso;
  const short = MONTH_NAMES[month - 1].slice(0, 3);
  return `${day} ${short} ${year}`;
}

export function monthOptions() {
  return MONTH_NAMES.map((name, i) => ({ value: i + 1, label: name }));
}

export function yearOptions(from = TIMELINE_START.year, ahead = 3): number[] {
  const now = new Date().getFullYear();
  const end = Math.max(now + ahead, from);
  const years: number[] = [];
  for (let y = from; y <= end; y++) years.push(y);
  return years;
}

/** Months from Jan 2025 through current month (+ optional buffer ahead). */
export function buildMonthSpine(bufferMonths = 2): {
  key: string;
  year: number;
  month: number;
  label: string;
}[] {
  const start = new Date(TIMELINE_START.year, TIMELINE_START.month - 1, 1);
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + bufferMonths, 1);
  const months: {
    key: string;
    year: number;
    month: number;
    label: string;
  }[] = [];

  const cursor = new Date(start);
  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;
    months.push({
      key: `${year}-${String(month).padStart(2, "0")}`,
      year,
      month,
      label: `${MONTH_NAMES[month - 1]} ${year}`,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

export function monthKeyFromDate(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function sortTimeline(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) return byDate;
    return a.createdAt.localeCompare(b.createdAt);
  });
}
