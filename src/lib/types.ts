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
  /** What do you want? */
  want: string;
  /** How do you want society to reward you? */
  reward: string;
  /** What will you build or deliver that others want? */
  offer: string;
  /** Who needs this, and why? */
  need: string;
  skillsHave: Skill[];
  skillsLack: Skill[];
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
] as const;

export type NoteTag = (typeof NOTE_TAGS)[number];

export interface Note {
  id: string;
  content: string;
  tags: NoteTag[];
  createdAt: string;
  updatedAt: string;
}

/** Overlap pairs shown in Insights / Connection View. */
export type InsightConnectionId =
  | "want-need"
  | "offer-need"
  | "offer-reward"
  | "have-need"
  | "want-gap";

export interface InsightIdea {
  id: string;
  /** Which overlap this idea belongs to. */
  connectionId: InsightConnectionId;
  text: string;
  source: "auto" | "manual";
  createdAt: string;
}

export interface AppData {
  map: PurposeMap | null;
  notes: Note[];
  insights: InsightIdea[];
}
