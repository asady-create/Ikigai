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

/** Map-linked tags for notes. */
export const NOTE_TAGS = [
  "Want",
  "Offer",
  "Need",
  "Reward",
  "Have",
  "Gap",
  "Idea",
  "Value",
] as const;

export type NoteTag = (typeof NOTE_TAGS)[number];

export interface Note {
  id: string;
  content: string;
  tags: NoteTag[];
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

/** Timeline event area — color-coded on the chrono view. */
export const TIMELINE_AREAS = [
  "love",
  "goodAt",
  "need",
  "reward",
  "offer",
  "skills",
  "values",
  "other",
] as const;

export type TimelineArea = (typeof TIMELINE_AREAS)[number];

export interface TimelineEvent {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  title: string;
  area: TimelineArea;
  note: string;
  createdAt: string;
}

export interface AppData {
  map: PurposeMap | null;
  notes: Note[];
  insights: InsightIdea[];
  timeline: TimelineEvent[];
}
