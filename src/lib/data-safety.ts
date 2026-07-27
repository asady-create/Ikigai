/**
 * Pure data-safety helpers (browser + server).
 * Goal: npm run dev / reload / stale tabs must never wipe saved content.
 */

import type {
  AppData,
  PurposeMap,
  TimelineAreaDef,
  TimelineEvent,
} from "./types";
import { DEFAULT_NOTE_TAGS } from "./types";
import { DEFAULT_TIMELINE_AREAS, normalizeTimelineAreas } from "./timeline";
import { normalizeNoteTags } from "./note-tags";

export const EMPTY_APP_DATA: AppData = {
  map: null,
  notes: [],
  insights: [],
  timeline: [],
  timelineAreas: DEFAULT_TIMELINE_AREAS.map((a) => ({ ...a })),
  noteTags: [...DEFAULT_NOTE_TAGS],
  revision: 0,
};

export function contentScore(data: AppData): number {
  let score = 0;
  const m = data.map;
  if (m) {
    for (const s of [
      m.want,
      m.goodAt,
      m.need,
      m.reward,
      m.offer,
      m.synthesis,
    ]) {
      if (s?.trim()) score += Math.min(s.trim().length, 200);
    }
    score += m.skillsHave.length * 20;
    score += m.skillsLack.length * 20;
    score += (m.values?.length ?? 0) * 10;
    for (const sk of [...m.skillsHave, ...m.skillsLack]) {
      if (sk.note?.trim()) score += Math.min(sk.note.trim().length, 80);
    }
  }
  for (const n of data.notes ?? []) {
    if (n.content?.trim()) score += Math.min(n.content.trim().length, 200);
  }
  score += (data.insights ?? []).length * 15;
  for (const e of data.timeline ?? []) {
    if (e.title?.trim()) score += Math.min(e.title.trim().length, 80) + 10;
  }
  return score;
}

export function isEffectivelyEmpty(data: AppData): boolean {
  return contentScore(data) === 0;
}

function mapScore(m: PurposeMap | null | undefined): number {
  if (!m) return 0;
  return contentScore({ ...EMPTY_APP_DATA, map: m });
}

function eventWeight(e: TimelineEvent): number {
  return e.title?.trim() ? Math.min(e.title.trim().length, 80) + 10 : 0;
}

function preferByTime<T extends { updatedAt?: string; createdAt?: string }>(
  a: T,
  b: T
): T {
  const ta = Date.parse(a.updatedAt || a.createdAt || "") || 0;
  const tb = Date.parse(b.updatedAt || b.createdAt || "") || 0;
  return tb >= ta ? b : a;
}

function unionById<T extends { id: string }>(
  left: T[],
  right: T[],
  prefer: (a: T, b: T) => T
): T[] {
  const map = new Map<string, T>();
  for (const item of left) map.set(item.id, item);
  for (const item of right) {
    const prev = map.get(item.id);
    map.set(item.id, prev ? prefer(prev, item) : item);
  }
  return [...map.values()];
}

function pickAreas(
  a: TimelineAreaDef[] | undefined,
  b: TimelineAreaDef[] | undefined
): TimelineAreaDef[] {
  const areasA = normalizeTimelineAreas(a);
  const areasB = normalizeTimelineAreas(b);
  const customized = (areas: TimelineAreaDef[]) =>
    areas.length !== DEFAULT_TIMELINE_AREAS.length ||
    areas.some((x, i) => x.label !== DEFAULT_TIMELINE_AREAS[i]?.label);
  if (customized(areasA)) return areasA;
  if (customized(areasB)) return areasB;
  return areasA;
}

function pickNoteTags(
  a: string[] | undefined,
  b: string[] | undefined
): string[] {
  return normalizeNoteTags([...(a ?? []), ...(b ?? [])]);
}

/** Union merge — never drops items that exist on only one side. */
export function mergeAppData(a: AppData, b: AppData): AppData {
  const map = mapScore(a.map) >= mapScore(b.map) ? a.map : b.map;
  const notes = unionById(a.notes ?? [], b.notes ?? [], preferByTime);
  const insights = unionById(
    a.insights ?? [],
    b.insights ?? [],
    preferByTime
  );
  const timeline = unionById(
    a.timeline ?? [],
    b.timeline ?? [],
    (x, y) => {
      const wx = eventWeight(x);
      const wy = eventWeight(y);
      if (wy !== wx) return wy > wx ? y : x;
      return preferByTime(x, y);
    }
  );
  const revision = Math.max(a.revision ?? 0, b.revision ?? 0);

  return {
    map: map ?? null,
    notes,
    insights,
    timeline,
    timelineAreas: pickAreas(a.timelineAreas, b.timelineAreas),
    noteTags: pickNoteTags(a.noteTags, b.noteTags),
    revision,
  };
}

/**
 * Protect existing disk/local data from a destructive incoming payload.
 * - Never replace a non-empty collection with []
 * - Never replace a rich map with null/empty
 * - If incoming revision is behind, merge instead of replace
 */
export function protectAgainstLoss(
  existing: AppData | null | undefined,
  incoming: AppData
): { data: AppData; protected: boolean; reason?: string } {
  if (!existing || isEffectivelyEmpty(existing)) {
    return { data: incoming, protected: false };
  }

  if (isEffectivelyEmpty(incoming)) {
    return {
      data: existing,
      protected: true,
      reason: "empty_overwrite_blocked",
    };
  }

  const existingRev = existing.revision ?? 0;
  const incomingRev = incoming.revision ?? 0;
  /** Only a newer revision may clear a collection to []. */
  const mayClearCollections = incomingRev > existingRev;

  // Stale writer (old tab / pre-hydrate) — merge, never replace
  if (incomingRev < existingRev) {
    return {
      data: {
        ...mergeAppData(existing, incoming),
        revision: existingRev,
      },
      protected: true,
      reason: "stale_revision_merged",
    };
  }

  let protectedWrite = false;
  const reasons: string[] = [];

  const map =
    mapScore(incoming.map) === 0 &&
    mapScore(existing.map) > 0 &&
    !mayClearCollections
      ? ((protectedWrite = true), reasons.push("map"), existing.map)
      : incoming.map ?? (mapScore(existing.map) > 0 ? existing.map : null);

  const notes =
    (incoming.notes?.length ?? 0) === 0 &&
    (existing.notes?.length ?? 0) > 0 &&
    !mayClearCollections
      ? ((protectedWrite = true), reasons.push("notes"), existing.notes)
      : incoming.notes;

  const insights =
    (incoming.insights?.length ?? 0) === 0 &&
    (existing.insights?.length ?? 0) > 0 &&
    !mayClearCollections
      ? ((protectedWrite = true),
        reasons.push("insights"),
        existing.insights)
      : incoming.insights;

  const timeline =
    (incoming.timeline?.length ?? 0) === 0 &&
    (existing.timeline?.length ?? 0) > 0 &&
    !mayClearCollections
      ? ((protectedWrite = true),
        reasons.push("timeline"),
        existing.timeline)
      : incoming.timeline;

  const timelineAreas =
    incoming.timelineAreas?.length
      ? incoming.timelineAreas
      : existing.timelineAreas;

  // If overall score dropped sharply while revision didn't advance much,
  // merge as a safety net (catches partial wipes that aren't full empties).
  const candidate: AppData = {
    map: map ?? null,
    notes: notes ?? [],
    insights: insights ?? [],
    timeline: timeline ?? [],
    timelineAreas: timelineAreas ?? existing.timelineAreas,
    noteTags: normalizeNoteTags([
      ...(incoming.noteTags ?? []),
      ...(existing.noteTags ?? []),
    ]),
    revision: Math.max(existingRev, incomingRev),
  };

  if (contentScore(candidate) < contentScore(existing) * 0.5) {
    return {
      data: {
        ...mergeAppData(existing, candidate),
        revision: Math.max(existingRev, incomingRev),
      },
      protected: true,
      reason: "score_drop_merged",
    };
  }

  return {
    data: candidate,
    protected: protectedWrite,
    reason: protectedWrite ? `kept:${reasons.join(",")}` : undefined,
  };
}

export function bumpRevision(data: AppData): AppData {
  return { ...data, revision: (data.revision ?? 0) + 1 };
}
