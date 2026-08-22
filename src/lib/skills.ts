/**
 * Skill portfolio helpers — status derivation + legacy have/lack migration.
 */

import type { Skill, SkillStatus, SkillType } from "./types";

export const SKILL_TYPES: SkillType[] = [
  "knowledge",
  "skill",
  "proof",
  "relationship",
];

export const LEGACY_TARGET_FALLBACK = "General / unassigned";

/** Legacy flat skill shape (pre–asset portfolio). */
export interface LegacySkill {
  id: string;
  name: string;
  note?: string;
}

export function clampLevel(n: unknown, fallback = 3): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(5, Math.max(1, Math.round(v)));
}

/**
 * Derive portfolio status from proficiency × demand.
 * - proficiency >= 4 and demand >= 3 → asset
 * - proficiency <= 2 and demand >= 3 → gap
 * - otherwise → developing
 */
export function deriveSkillStatus(
  proficiency: number,
  demand: number
): SkillStatus {
  const p = clampLevel(proficiency);
  const d = clampLevel(demand);
  if (p >= 4 && d >= 3) return "asset";
  if (p <= 2 && d >= 3) return "gap";
  return "developing";
}

export function resolveMigrationTargetDirection(
  want?: string | null,
  offer?: string | null
): string {
  const w = (want ?? "").trim();
  if (w) return w;
  const o = (offer ?? "").trim();
  if (o) return o;
  return LEGACY_TARGET_FALLBACK;
}

function migrateOne(
  legacy: LegacySkill,
  proficiency: number,
  demand: number,
  targetDirection: string,
  reviewedAt: string
): Skill {
  const proficiencyClamped = clampLevel(proficiency);
  const demandClamped = clampLevel(demand);
  return {
    id: legacy.id || `migrated-${Math.random().toString(36).slice(2, 10)}`,
    name: (legacy.name ?? "").trim() || "Untitled",
    type: "skill",
    proficiency: proficiencyClamped,
    demand: demandClamped,
    evidence: (legacy.note ?? "").trim(),
    targetDirection,
    status: deriveSkillStatus(proficiencyClamped, demandClamped),
    lastReviewed: reviewedAt,
  };
}

/**
 * Convert have/lack lists into the portfolio schema.
 * have → proficiency 4, demand 3 (asset)
 * lack → proficiency 1, demand 4 (gap)
 */
export function migrateHaveLackToSkills(
  have: LegacySkill[] | undefined,
  lack: LegacySkill[] | undefined,
  want?: string | null,
  offer?: string | null,
  reviewedAt: string = new Date().toISOString()
): Skill[] {
  const targetDirection = resolveMigrationTargetDirection(want, offer);
  const fromHave = (have ?? []).map((s) =>
    migrateOne(s, 4, 3, targetDirection, reviewedAt)
  );
  const fromLack = (lack ?? []).map((s) =>
    migrateOne(s, 1, 4, targetDirection, reviewedAt)
  );
  return [...fromHave, ...fromLack];
}

export function withDerivedStatus(
  skill: Omit<Skill, "status"> & { status?: SkillStatus }
): Skill {
  const proficiency = clampLevel(skill.proficiency);
  const demand = clampLevel(skill.demand);
  return {
    ...skill,
    name: skill.name ?? "",
    type: SKILL_TYPES.includes(skill.type) ? skill.type : "skill",
    proficiency,
    demand,
    evidence: skill.evidence ?? "",
    targetDirection: skill.targetDirection ?? "",
    lastReviewed: skill.lastReviewed || new Date().toISOString(),
    status: deriveSkillStatus(proficiency, demand),
  };
}

export function normalizeSkill(raw: Partial<Skill> & { id: string }): Skill {
  return withDerivedStatus({
    id: raw.id,
    name: raw.name ?? "",
    type: (raw.type as SkillType) ?? "skill",
    proficiency: clampLevel(raw.proficiency, 3),
    demand: clampLevel(raw.demand, 3),
    evidence: raw.evidence ?? (raw as { note?: string }).note ?? "",
    targetDirection: raw.targetDirection ?? "",
    lastReviewed: raw.lastReviewed || new Date().toISOString(),
  });
}

/** Raw map shape that may still carry legacy arrays. */
export type RawPurposeMapSkills = {
  skills?: Partial<Skill>[];
  skillsHave?: LegacySkill[];
  skillsLack?: LegacySkill[];
  want?: string;
  offer?: string;
};

/**
 * Resolve the skills array from new or legacy storage.
 * Prefer `skills` when present and non-empty; otherwise migrate have/lack.
 */
export function resolveSkillsFromRaw(raw: RawPurposeMapSkills | null): Skill[] {
  if (!raw) return [];
  const existing = raw.skills;
  if (Array.isArray(existing) && existing.length > 0) {
    return existing
      .filter((s): s is Partial<Skill> & { id: string } => Boolean(s?.id))
      .map(normalizeSkill);
  }
  // Empty skills array with leftover legacy lists → migrate
  const have = raw.skillsHave ?? [];
  const lack = raw.skillsLack ?? [];
  if (have.length > 0 || lack.length > 0) {
    return migrateHaveLackToSkills(have, lack, raw.want, raw.offer);
  }
  if (Array.isArray(existing)) {
    return existing
      .filter((s): s is Partial<Skill> & { id: string } => Boolean(s?.id))
      .map(normalizeSkill);
  }
  return [];
}

export function skillsByStatus(
  skills: Skill[],
  status: SkillStatus
): Skill[] {
  return skills
    .filter((s) => s.status === status && s.name.trim())
    .sort((a, b) => b.demand - a.demand || a.name.localeCompare(b.name));
}
