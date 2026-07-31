/**
 * Ikigai 2.0 — personal purpose map.
 */

export interface Skill {
  id: string;
  name: string;
  /** Optional one-line context. */
  note: string;
}

export interface PurposeMap {
  /** What you love / what you want. */
  want: string;
  /** What you’re good at (reflection). */
  goodAt: string;
  /** What the world needs / who needs it. */
  need: string;
  /** What you can be paid for / how you’re rewarded. */
  reward: string;
  /** What you will deliver (center / offer). */
  offer: string;
  skillsHave: Skill[];
  skillsLack: Skill[];
  /** Non-negotiable values that guide choices. */
  values: string[];
  /** Plain synthesis of the above. Editable. */
  synthesis: string;
  updatedAt: string;
}

/** Default map-linked tags for notes — users can rename, add, or remove. */
export const DEFAULT_NOTE_TAGS = [
  "Want",
  "Offer",
  "Need",
  "Reward",
  "Have",
  "Gap",
  "Idea",
  "Value",
] as const;

/** @deprecated Prefer string tags + AppData.noteTags */
export const NOTE_TAGS = DEFAULT_NOTE_TAGS;

export type NoteTag = string;

export interface Note {
  id: string;
  content: string;
  /** Freeform hashtag labels (from vocabulary or typed). */
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/** Classic ikigai intersections for Insights. */
export type InsightConnectionId =
  | "passion"
  | "mission"
  | "profession"
  | "vocation"
  | "ikigai";

export interface InsightIdea {
  id: string;
  connectionId: InsightConnectionId;
  text: string;
  source: "auto" | "manual";
  createdAt: string;
}

/** User-defined (or default) timeline area with a color. */
export interface TimelineAreaDef {
  id: string;
  label: string;
  color: string;
}

export interface TimelineEvent {
  id: string;
  /**
   * Partial or full date, or null when unknown:
   * - `YYYY-MM-DD` — exact day
   * - `YYYY-MM` — month + year only (day unknown)
   * - `null` — no date
   */
  date: string | null;
  title: string;
  /** References TimelineAreaDef.id */
  areaId: string;
  note: string;
  createdAt: string;
  /** Manual position on the arrow (lower = higher / earlier) */
  order: number;
}

export interface AppData {
  map: PurposeMap | null;
  notes: Note[];
  insights: InsightIdea[];
  timeline: TimelineEvent[];
  timelineAreas: TimelineAreaDef[];
  /** User-editable hashtag vocabulary for the mini journal. */
  noteTags: string[];
  /**
   * Monotonic save counter. Disk rejects/merges writes with a lower revision
   * so a stale tab or pre-hydrate payload cannot wipe newer data.
   */
  revision?: number;
}
