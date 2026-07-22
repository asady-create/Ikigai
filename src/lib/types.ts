/**
 * Ikigai 2.0 — personal purpose map.
 * Four questions + skill gap. Nothing else.
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

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  map: PurposeMap | null;
  notes: Note[];
}
