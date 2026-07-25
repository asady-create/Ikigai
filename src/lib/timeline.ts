import type { TimelineArea, TimelineEvent } from "./types";
import { TIMELINE_AREAS } from "./types";

export const TIMELINE_START = { year: 2025, month: 1 }; // January 2025

export const AREA_META: Record<
  TimelineArea,
  { label: string; color: string; bg: string }
> = {
  love: { label: "Love / want", color: "#0d5c63", bg: "rgba(13, 92, 99, 0.12)" },
  goodAt: {
    label: "Good at",
    color: "#256378",
    bg: "rgba(37, 99, 120, 0.12)",
  },
  need: {
    label: "World needs",
    color: "#475569",
    bg: "rgba(71, 85, 105, 0.12)",
  },
  reward: {
    label: "Paid for",
    color: "#0f766e",
    bg: "rgba(15, 118, 110, 0.12)",
  },
  offer: {
    label: "Deliver",
    color: "#b45309",
    bg: "rgba(180, 83, 9, 0.12)",
  },
  skills: {
    label: "Skills",
    color: "#7c3aed",
    bg: "rgba(124, 58, 237, 0.12)",
  },
  values: {
    label: "Values",
    color: "#be123c",
    bg: "rgba(190, 18, 60, 0.1)",
  },
  other: {
    label: "Other",
    color: "#78716c",
    bg: "rgba(120, 113, 108, 0.12)",
  },
};

export function isTimelineArea(value: string): value is TimelineArea {
  return (TIMELINE_AREAS as readonly string[]).includes(value);
}

export function normalizeTimelineEvent(
  raw: Partial<TimelineEvent> & { id: string }
): TimelineEvent {
  const area = raw.area && isTimelineArea(raw.area) ? raw.area : "other";
  return {
    id: raw.id,
    date: raw.date || new Date().toISOString().slice(0, 10),
    title: raw.title ?? "",
    area,
    note: raw.note ?? "",
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
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
      label: cursor.toLocaleString(undefined, {
        month: "short",
        year: "numeric",
      }),
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
