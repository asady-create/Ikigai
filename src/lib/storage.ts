/**
 * Persistence:
 * 1) Disk file via /api/data → data/ikigai-store.json (survives reboot)
 * 2) localStorage cache + snapshot (fast UI, offline buffer)
 *
 * Safety:
 * - revision counters block stale tabs from overwriting newer data
 * - empty / partial wipes are rejected or merged
 * - disk keeps .prev + rotating .bak backups on every write
 */

import type {
  AppData,
  InsightIdea,
  Note,
  PurposeMap,
  TimelineAreaDef,
  TimelineEvent,
} from "./types";
import { DEFAULT_NOTE_TAGS } from "./types";
import { createEmptyMap, normalizeMap } from "./synthesis";
import {
  normalizeNoteTagList,
  normalizeNoteTags,
} from "./note-tags";
import { normalizeInsights } from "./insights";
import {
  DEFAULT_TIMELINE_AREAS,
  normalizeTimelineAreas,
  normalizeTimelineEvent,
} from "./timeline";
import {
  bumpRevision,
  contentScore,
  isEffectivelyEmpty,
  mergeAppData,
  protectAgainstLoss,
} from "./data-safety";

export { contentScore, isEffectivelyEmpty, mergeAppData } from "./data-safety";

const STORAGE_KEY = "ikigai:v2";
const SNAPSHOT_KEY = "ikigai:v2:snapshot";
const BACKUP_KEY = "ikigai:v2:backup";
const LEGACY_KEY = "ikigai:v1";

const DEFAULT_DATA: AppData = {
  map: null,
  notes: [],
  insights: [],
  timeline: [],
  timelineAreas: DEFAULT_TIMELINE_AREAS.map((a) => ({ ...a })),
  noteTags: [...DEFAULT_NOTE_TAGS],
  revision: 0,
};

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeNote(
  raw: Partial<Note> & { id: string; content: string },
  vocabulary: string[] = [...DEFAULT_NOTE_TAGS]
): Note {
  return {
    id: raw.id,
    content: raw.content ?? "",
    tags: normalizeNoteTagList(raw.tags, vocabulary),
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? raw.createdAt ?? new Date().toISOString(),
  };
}

export function normalizeAppData(raw: Partial<AppData> | null): AppData {
  if (!raw) return structuredClone(DEFAULT_DATA);
  const timelineAreas = normalizeTimelineAreas(raw.timelineAreas);
  const noteTags = normalizeNoteTags(raw.noteTags);
  // Also learn tags already used on notes
  const used = new Set(noteTags.map((t) => t.toLowerCase()));
  for (const n of raw.notes ?? []) {
    for (const t of n.tags ?? []) {
      const label = String(t ?? "").replace(/^#/, "").trim();
      if (!label) continue;
      const key = label.toLowerCase();
      if (!used.has(key)) {
        used.add(key);
        noteTags.push(label.slice(0, 32));
      }
    }
  }
  return {
    ...structuredClone(DEFAULT_DATA),
    ...raw,
    map: raw.map ? normalizeMap(raw.map) : null,
    notes: (raw.notes ?? []).map((n) => normalizeNote(n, noteTags)),
    insights: normalizeInsights(raw.insights),
    timelineAreas,
    noteTags,
    timeline: (raw.timeline ?? []).map((e, i) =>
      normalizeTimelineEvent(
        e as TimelineEvent & { area?: string },
        timelineAreas,
        i
      )
    ),
    revision: raw.revision ?? 0,
  };
}

function parsePayload(raw: string): AppData | null {
  try {
    return normalizeAppData(JSON.parse(raw) as Partial<AppData>);
  } catch {
    return null;
  }
}

function migrateLegacy(): AppData | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      canvas?: {
        ikigai?: {
          love?: string;
          goodAt?: string;
          worldNeeds?: string;
          paidFor?: string;
        };
        visionStatement?: string;
      };
      reflections?: {
        id: string;
        content: string;
        createdAt: string;
        updatedAt: string;
      }[];
    };

    const map = createEmptyMap();
    const ik = parsed.canvas?.ikigai;
    if (ik) {
      map.want = ik.love ?? "";
      map.goodAt = ik.goodAt ?? "";
      map.offer = ik.worldNeeds ?? "";
      map.need = ik.worldNeeds ?? "";
      map.reward = ik.paidFor ?? "";
      if (ik.goodAt?.trim()) {
        map.skillsHave = ik.goodAt
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((name, i) => ({
            id: `migrated-have-${i}`,
            name,
            note: "",
          }));
      }
      map.synthesis = parsed.canvas?.visionStatement ?? "";
    }

    const notes: Note[] = (parsed.reflections ?? [])
      .filter((r) => r.content?.trim())
      .map((r) =>
        normalizeNote({
          id: r.id,
          content: r.content,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          tags: [],
        })
      );

    const data: AppData = {
      map: parsed.canvas ? map : null,
      notes,
      insights: [],
      timeline: [],
      timelineAreas: DEFAULT_TIMELINE_AREAS.map((a) => ({ ...a })),
      noteTags: [...DEFAULT_NOTE_TAGS],
      revision: 1,
    };
    saveAppDataLocal(data, { force: true });
    window.localStorage.removeItem(LEGACY_KEY);
    return data;
  } catch {
    return null;
  }
}

function readKey(key: string): AppData | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return parsePayload(raw);
  } catch {
    return null;
  }
}

/** Synchronous browser cache only. */
export function loadAppDataLocal(): AppData {
  if (!isBrowser()) return structuredClone(DEFAULT_DATA);

  const primary = readKey(STORAGE_KEY);
  const snapshot = readKey(SNAPSHOT_KEY);

  if (primary && snapshot) {
    const merged = mergeAppData(primary, snapshot);
    if (contentScore(merged) > contentScore(primary)) {
      saveAppDataLocal(merged, { force: true });
      return merged;
    }
    return primary;
  }
  if (primary && !isEffectivelyEmpty(primary)) return primary;
  if (snapshot && !isEffectivelyEmpty(snapshot)) {
    saveAppDataLocal(snapshot, { force: true });
    return snapshot;
  }
  if (primary) return primary;

  try {
    const backup = window.sessionStorage.getItem(BACKUP_KEY);
    if (backup) {
      const parsed = parsePayload(backup);
      if (parsed && !isEffectivelyEmpty(parsed)) {
        saveAppDataLocal(parsed, { force: true });
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }

  return migrateLegacy() ?? structuredClone(DEFAULT_DATA);
}

/** @deprecated use loadAppDataLocal or hydrateAppData */
export function loadAppData(): AppData {
  return loadAppDataLocal();
}

function writeLocalRaw(data: AppData): void {
  const json = JSON.stringify(data);
  try {
    window.localStorage.setItem(STORAGE_KEY, json);
  } catch (err) {
    console.warn("[ikigai] localStorage write failed", err);
  }

  if (!isEffectivelyEmpty(data)) {
    try {
      window.localStorage.setItem(SNAPSHOT_KEY, json);
    } catch {
      /* ignore */
    }
  }

  try {
    window.sessionStorage.setItem(BACKUP_KEY, json);
  } catch {
    /* ignore */
  }
}

function saveAppDataLocal(
  data: AppData,
  opts: { force?: boolean } = {}
): boolean {
  if (!isBrowser()) return false;

  const existing = readKey(STORAGE_KEY) ?? readKey(SNAPSHOT_KEY);

  if (!opts.force) {
    const guarded = protectAgainstLoss(existing, data);
    if (guarded.protected && guarded.reason === "empty_overwrite_blocked") {
      console.warn(
        "[ikigai] Blocked empty overwrite — your saved data was kept."
      );
      return false;
    }
    writeLocalRaw(normalizeAppData(guarded.data));
    if (guarded.protected) {
      console.warn(
        `[ikigai] Local write protected (${guarded.reason}) — kept existing fields.`
      );
    }
    return true;
  }

  writeLocalRaw(normalizeAppData(data));
  return true;
}

let diskTimer: ReturnType<typeof setTimeout> | null = null;

/** Write to disk file via API (survives computer restart). */
export function syncToDisk(data: AppData, immediate = false): void {
  if (!isBrowser()) return;
  if (isEffectivelyEmpty(data)) return;

  const send = () => {
    const body = JSON.stringify(data);
    try {
      if (immediate && typeof navigator !== "undefined" && navigator.sendBeacon) {
        const ok = navigator.sendBeacon(
          "/api/data",
          new Blob([body], { type: "application/json" })
        );
        if (ok) return;
      }
    } catch {
      /* fall through */
    }
    void fetch("/api/data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch((err) => console.warn("[ikigai] disk sync failed", err));
  };

  if (immediate) {
    if (diskTimer) clearTimeout(diskTimer);
    send();
    return;
  }

  if (diskTimer) clearTimeout(diskTimer);
  diskTimer = setTimeout(send, 200);
}

export async function fetchDiskData(): Promise<AppData | null> {
  if (!isBrowser()) return null;
  try {
    const res = await fetch("/api/data", { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: Partial<AppData> };
    if (!json.data) return null;
    return normalizeAppData(json.data);
  } catch {
    return null;
  }
}

/**
 * Load from disk (source of truth) + merge with browser cache.
 * Call once on app start before marking ready.
 */
export async function hydrateAppData(): Promise<AppData> {
  const local = loadAppDataLocal();
  const disk = await fetchDiskData();

  let merged: AppData;
  if (!disk || isEffectivelyEmpty(disk)) {
    merged = local;
  } else if (isEffectivelyEmpty(local)) {
    merged = disk;
  } else {
    // Union-merge so map/notes on one side and timeline on the other are both kept
    merged = mergeAppData(disk, local);
  }

  // Advance revision so this session's later saves beat any stale tab
  merged = bumpRevision(normalizeAppData(merged));
  saveAppDataLocal(merged, { force: true });
  if (!isEffectivelyEmpty(merged)) {
    syncToDisk(merged, true);
  }
  return merged;
}

export function saveAppData(
  data: AppData,
  opts: { force?: boolean; skipDisk?: boolean } = {}
): void {
  const withRev = opts.force ? data : bumpRevision(data);
  const wrote = saveAppDataLocal(withRev, opts);
  if (wrote && !opts.skipDisk && !isEffectivelyEmpty(withRev)) {
    syncToDisk(withRev);
  }
}

/** Immediate flush to browser + disk (never writes empty). */
export function flushAppData(data: AppData): void {
  if (isEffectivelyEmpty(data)) return;
  // Don't bump revision on flush — just persist current session state safely
  const existing = loadAppDataLocal();
  const guarded = protectAgainstLoss(existing, data);
  saveAppDataLocal(guarded.data, { force: true });
  syncToDisk(guarded.data, true);
}

export function getMap(): PurposeMap | null {
  return loadAppDataLocal().map;
}

export function saveMap(map: PurposeMap): AppData {
  const data = loadAppDataLocal();
  data.map = normalizeMap({ ...map, updatedAt: new Date().toISOString() });
  saveAppData(data);
  return loadAppDataLocal();
}

export function getNotes(): Note[] {
  return loadAppDataLocal().notes.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function saveNote(note: Note): AppData {
  const data = loadAppDataLocal();
  const vocabulary = normalizeNoteTags(data.noteTags);
  const normalized = normalizeNote(note, vocabulary);
  // Ensure any new tags on the note join the vocabulary
  const nextVocab = normalizeNoteTags([
    ...vocabulary,
    ...normalized.tags,
  ]);
  data.noteTags = nextVocab;
  const idx = data.notes.findIndex((n) => n.id === normalized.id);
  if (idx === -1) data.notes.push(normalizeNote(normalized, nextVocab));
  else data.notes[idx] = normalizeNote(normalized, nextVocab);
  saveAppData(data);
  return loadAppDataLocal();
}

export function deleteNote(id: string): AppData {
  const data = loadAppDataLocal();
  data.notes = data.notes.filter((n) => n.id !== id);
  saveAppData(data);
  return loadAppDataLocal();
}

export function saveInsights(insights: InsightIdea[]): AppData {
  const data = loadAppDataLocal();
  data.insights = normalizeInsights(insights);
  saveAppData(data);
  return loadAppDataLocal();
}

export function saveTimeline(timeline: TimelineEvent[]): AppData {
  const data = loadAppDataLocal();
  const areas = normalizeTimelineAreas(data.timelineAreas);
  data.timelineAreas = areas;
  data.timeline = timeline.map((e, i) =>
    normalizeTimelineEvent(e, areas, i)
  );
  saveAppData(data);
  return loadAppDataLocal();
}

export function saveTimelineAreas(areas: TimelineAreaDef[]): AppData {
  const data = loadAppDataLocal();
  const nextAreas = normalizeTimelineAreas(areas);
  data.timelineAreas = nextAreas;
  const ids = new Set(nextAreas.map((a) => a.id));
  const fallback = nextAreas[0]?.id ?? "other";
  data.timeline = (data.timeline ?? []).map((e, i) =>
    normalizeTimelineEvent(
      { ...e, areaId: ids.has(e.areaId) ? e.areaId : fallback },
      nextAreas,
      i
    )
  );
  saveAppData(data);
  return loadAppDataLocal();
}

export function saveNoteTags(noteTags: string[]): AppData {
  const data = loadAppDataLocal();
  const nextTags = normalizeNoteTags(noteTags);
  data.noteTags = nextTags;
  // Remap note tags: keep those still in vocabulary (case-insensitive)
  const byKey = new Map(nextTags.map((t) => [t.toLowerCase(), t]));
  data.notes = data.notes.map((n) => ({
    ...n,
    tags: n.tags
      .map((t) => byKey.get(t.toLowerCase()))
      .filter((t): t is string => Boolean(t)),
    updatedAt: new Date().toISOString(),
  }));
  saveAppData(data);
  return loadAppDataLocal();
}

export function exportMapMarkdown(): string {
  const { map, notes, insights, timeline } = loadAppDataLocal();
  const lines = [
    "# Ikigai 2.0",
    "",
    `_Exported ${new Date().toLocaleString()}_`,
    "",
  ];

  if (map) {
    lines.push("## What you love", "", map.want || "—", "");
    lines.push("## What you’re good at", "", map.goodAt || "—", "");
    lines.push("## What the world needs", "", map.need || "—", "");
    lines.push("## What you can be paid for", "", map.reward || "—", "");
    lines.push("## What I deliver", "", map.offer || "—", "");
    lines.push("## Values", "");
    if (!map.values?.length) lines.push("—", "");
    else {
      for (const v of map.values) lines.push(`- ${v}`);
      lines.push("");
    }
    lines.push("## Skills I have", "");
    if (map.skillsHave.length === 0) lines.push("—", "");
    else {
      for (const s of map.skillsHave) {
        lines.push(`- ${s.name}${s.note ? ` — ${s.note}` : ""}`);
      }
      lines.push("");
    }
    lines.push("## Skills I lack", "");
    if (map.skillsLack.length === 0) lines.push("—", "");
    else {
      for (const s of map.skillsLack) {
        lines.push(`- ${s.name}${s.note ? ` — ${s.note}` : ""}`);
      }
      lines.push("");
    }
    if (map.synthesis.trim()) {
      lines.push("## Synthesis", "", map.synthesis, "");
    }
  }

  if (insights.length > 0) {
    lines.push("## Insights", "");
    for (const idea of insights) {
      lines.push(`- [${idea.connectionId}] ${idea.text}`);
    }
    lines.push("");
  }

  if (notes.length > 0) {
    lines.push("## Notes", "");
    for (const n of notes) {
      const tagStr =
        n.tags.length > 0 ? ` · ${n.tags.map((t) => `#${t}`).join(" ")}` : "";
      lines.push(
        `### ${new Date(n.createdAt).toLocaleString()}${tagStr}`,
        "",
        n.content,
        ""
      );
    }
  }

  if ((timeline ?? []).length > 0) {
    const areas = loadAppDataLocal().timelineAreas;
    lines.push("## Timeline", "");
    for (const e of [...timeline].sort((a, b) => a.order - b.order)) {
      const label =
        areas.find((a) => a.id === e.areaId)?.label ?? e.areaId;
      const when = e.date ?? "date unknown";
      lines.push(
        `- ${when} · [${label}] ${e.title}${e.note ? ` — ${e.note}` : ""}`
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function downloadMarkdown(filename = "ikigai.md"): void {
  if (!isBrowser()) return;
  const md = exportMapMarkdown();
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function resetAllData(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(SNAPSHOT_KEY);
  window.localStorage.removeItem(LEGACY_KEY);
  try {
    window.sessionStorage.removeItem(BACKUP_KEY);
  } catch {
    /* ignore */
  }
  void fetch("/api/data", {
    method: "DELETE",
  }).catch(() => {});
}
