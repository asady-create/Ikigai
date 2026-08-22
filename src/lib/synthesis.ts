import type { PurposeMap, Skill } from "./types";
import { resolveSkillsFromRaw, skillsByStatus } from "./skills";

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
 */
export function generateSynthesis(map: PurposeMap): string {
  const parts: string[] = [];

  const want = clean(map.want);
  const goodAt = clean(map.goodAt);
  const need = clean(map.need);
  const reward = clean(map.reward);
  const offer = clean(map.offer);
  const assets = skillNames(skillsByStatus(map.skills ?? [], "asset"));
  const gaps = skillNames(skillsByStatus(map.skills ?? [], "gap"));
  const developing = skillNames(
    skillsByStatus(map.skills ?? [], "developing")
  );

  if (want) parts.push(`I love / want: ${want}.`);
  if (goodAt) parts.push(`I’m good at: ${goodAt}.`);
  if (need) parts.push(`The world needs: ${need}.`);
  if (reward) parts.push(`I can be rewarded by: ${reward}.`);
  if (offer) parts.push(`I will deliver: ${offer}.`);
  if (assets) parts.push(`Asset portfolio: ${assets}.`);
  if (gaps) parts.push(`Development gaps: ${gaps}.`);
  if (developing) parts.push(`Developing: ${developing}.`);
  if (map.values.length > 0) {
    parts.push(`Values: ${map.values.join(", ")}.`);
  }

  if (parts.length === 0) return "";
  return parts.join(" ");
}

/** Section fill status for the overview. */
export function mapProgress(map: PurposeMap | null): {
  want: boolean;
  goodAt: boolean;
  need: boolean;
  reward: boolean;
  offer: boolean;
  values: boolean;
  skillsAssets: boolean;
  skillsGaps: boolean;
  filled: number;
  total: number;
} {
  const empty = {
    want: false,
    goodAt: false,
    need: false,
    reward: false,
    offer: false,
    values: false,
    skillsAssets: false,
    skillsGaps: false,
    filled: 0,
    total: 8,
  };
  if (!map) return empty;

  const want = Boolean(clean(map.want));
  const goodAt = Boolean(clean(map.goodAt ?? ""));
  const need = Boolean(clean(map.need));
  const reward = Boolean(clean(map.reward));
  const offer = Boolean(clean(map.offer));
  const values = (map.values ?? []).some((v) => v.trim());
  const skills = map.skills ?? [];
  const skillsAssets = skills.some(
    (s) => s.status === "asset" && s.name.trim()
  );
  const skillsGaps = skills.some(
    (s) =>
      (s.status === "gap" || s.status === "developing") && s.name.trim()
  );
  const flags = {
    want,
    goodAt,
    need,
    reward,
    offer,
    values,
    skillsAssets,
    skillsGaps,
  };
  const filled = Object.values(flags).filter(Boolean).length;

  return { ...flags, filled, total: 8 };
}

export function createEmptyMap(): PurposeMap {
  return {
    want: "",
    goodAt: "",
    reward: "",
    offer: "",
    need: "",
    skills: [],
    values: [],
    synthesis: "",
    updatedAt: new Date().toISOString(),
  };
}

/** Normalize older maps missing fields; migrate have/lack → skills. */
export function normalizeMap(raw: Partial<PurposeMap> | null): PurposeMap {
  const base = createEmptyMap();
  if (!raw) return base;
  const skills = resolveSkillsFromRaw(raw);
  // Drop deprecated arrays from the normalized object
  const {
    skillsHave: _have,
    skillsLack: _lack,
    ...rest
  } = raw as Partial<PurposeMap> & {
    skillsHave?: unknown;
    skillsLack?: unknown;
  };
  void _have;
  void _lack;
  return {
    ...base,
    ...rest,
    goodAt: raw.goodAt ?? "",
    skills,
    values: raw.values ?? [],
  };
}
