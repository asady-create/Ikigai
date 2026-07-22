import type { PurposeMap, Skill } from "./types";

function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim().replace(/[.]+$/, "");
}

function skillNames(skills: Skill[]): string {
  return skills
    .map((s) => s.name.trim())
    .filter(Boolean)
    .join(", ");
}

/**
 * Build a plain, precise synthesis from the purpose map.
 * No motivational filler — just the facts you wrote.
 */
export function generateSynthesis(map: PurposeMap): string {
  const parts: string[] = [];

  const want = clean(map.want);
  const offer = clean(map.offer);
  const need = clean(map.need);
  const reward = clean(map.reward);
  const have = skillNames(map.skillsHave);
  const lack = skillNames(map.skillsLack);

  if (want) parts.push(`I want: ${want}.`);
  if (offer) parts.push(`I will deliver: ${offer}.`);
  if (need) parts.push(`People need this because: ${need}.`);
  if (reward) parts.push(`I want to be rewarded by: ${reward}.`);
  if (have) parts.push(`Skills I have: ${have}.`);
  if (lack) parts.push(`Skills I still need: ${lack}.`);

  if (parts.length === 0) {
    return "";
  }

  return parts.join(" ");
}

/** Section fill status for the overview. */
export function mapProgress(map: PurposeMap | null): {
  want: boolean;
  offer: boolean;
  need: boolean;
  reward: boolean;
  skillsHave: boolean;
  skillsLack: boolean;
  filled: number;
  total: number;
} {
  const empty = {
    want: false,
    offer: false,
    need: false,
    reward: false,
    skillsHave: false,
    skillsLack: false,
    filled: 0,
    total: 6,
  };
  if (!map) return empty;

  const want = Boolean(clean(map.want));
  const offer = Boolean(clean(map.offer));
  const need = Boolean(clean(map.need));
  const reward = Boolean(clean(map.reward));
  const skillsHave = map.skillsHave.some((s) => s.name.trim());
  const skillsLack = map.skillsLack.some((s) => s.name.trim());
  const flags = { want, offer, need, reward, skillsHave, skillsLack };
  const filled = Object.values(flags).filter(Boolean).length;

  return { ...flags, filled, total: 6 };
}

export function createEmptyMap(): PurposeMap {
  return {
    want: "",
    reward: "",
    offer: "",
    need: "",
    skillsHave: [],
    skillsLack: [],
    synthesis: "",
    updatedAt: new Date().toISOString(),
  };
}
