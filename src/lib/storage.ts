/**
 * Persistence:
 * 1) Disk file via /api/data → data/ikigai-store.json (survives reboot)
 * 2) localStorage cache + snapshot (fast UI, offline buffer)
 *
 * Disk is the source of truth on your computer when the Next.js app is running.
 */

import type {
  AppData,
  InsightIdea,
  Note,
  NoteTag,
  PurposeMap,
} from "./types";
import { NOTE_TAGS } from "./types";
import { createEmptyMap, normalizeMap } from "./synthesis";
import { isNoteTag } from "./note-tags";
import { normalizeInsights } from "./insights";

const STORAGE_KEY = "ikigai:v2";
const SNAPSHOT_KEY = "ikigai:v2:snapshot";
const BACKUP_KEY = "ikigai:v2:backup";
const LEGACY_KEY = "ikigai:v1";

const DEFAULT_DATA: AppData = {
  map: null,
  notes: [],
  insights: [],
};

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeNote(
  raw: Partial<Note> & { id: string; content: string }
): Note {
  const tags = Array.isArray(raw.tags)
    ? (raw.tags.filter((t) => isNoteTag(String(t))) as NoteTag[])
    : [];
  return {
    id: raw.id,
    content: raw.content ?? "",
    tags: NOTE_TAGS.filter((t) => tags.includes(t)),
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? raw.createdAt ?? new Date().toISOString(),
  };
}

export function normalizeAppData(raw: Partial<AppData> | null): AppData {
  if (!raw) return structuredClone(DEFAULT_DATA);
  return {
    ...structuredClone(DEFAULT_DATA),
    ...raw,
    map: raw.map ? normalizeMap(raw.map) : null,
    notes: (raw.notes ?? []).map((n) => normalizeNote(n)),
    insights: normalizeInsights(raw.insights),
  };
}

function parsePayload(raw: string): AppData | null {
  try {
    return normalizeAppData(JSON.parse(raw) as Partial<AppData>);
  } catch {
    return null;
  }
}

/** How much real content is in this payload — used to block empty overwrites. */
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
  for (const n of data.notes) {
    if (n.content?.trim()) score += Math.min(n.content.trim().length, 200);
  }
  score += data.insights.length * 15;
  return score;
}

export function isEffectivelyEmpty(data: AppData): boolean {
  return contentScore(data) === 0;
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
    if (contentScore(snapshot) > contentScore(primary)) {
      saveAppDataLocal(snapshot, { force: true });
      return snapshot;
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

function saveAppDataLocal(
  data: AppData,
  opts: { force?: boolean } = {}
): boolean {
  if (!isBrowser()) return false;

  if (!opts.force) {
    const existing = readKey(STORAGE_KEY) ?? readKey(SNAPSHOT_KEY);
    if (
      existing &&
      !isEffectivelyEmpty(existing) &&
      isEffectivelyEmpty(data)
    ) {
      console.warn(
        "[ikigai] Blocked empty overwrite — your saved data was kept."
      );
      return false;
    }
  }

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

  if (!disk || isEffectivelyEmpty(disk)) {
    if (!isEffectivelyEmpty(local)) {
      // Migrate browser data onto disk
      syncToDisk(local, true);
    }
    return local;
  }

  if (contentScore(disk) >= contentScore(local)) {
    saveAppDataLocal(disk, { force: true });
    return disk;
  }

  // Browser has newer/richer content — push up to disk
  syncToDisk(local, true);
  return local;
}

export function saveAppData(
  data: AppData,
  opts: { force?: boolean; skipDisk?: boolean } = {}
): void {
  const wrote = saveAppDataLocal(data, opts);
  if (wrote && !opts.skipDisk && !isEffectivelyEmpty(data)) {
    syncToDisk(data);
  }
}

/** Immediate flush to browser + disk. */
export function flushAppData(data: AppData): void {
  if (isEffectivelyEmpty(data)) return;
  saveAppDataLocal(data);
  syncToDisk(data, true);
}

export function getMap(): PurposeMap | null {
  return loadAppDataLocal().map;
}

export function saveMap(map: PurposeMap): AppData {
  const data = loadAppDataLocal();
  data.map = normalizeMap({ ...map, updatedAt: new Date().toISOString() });
  saveAppData(data);
  return data;
}

export function getNotes(): Note[] {
  return loadAppDataLocal().notes.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function saveNote(note: Note): AppData {
  const data = loadAppDataLocal();
  const normalized = normalizeNote(note);
  const idx = data.notes.findIndex((n) => n.id === normalized.id);
  if (idx === -1) data.notes.push(normalized);
  else data.notes[idx] = normalized;
  saveAppData(data);
  return data;
}

export function deleteNote(id: string): AppData {
  const data = loadAppDataLocal();
  data.notes = data.notes.filter((n) => n.id !== id);
  saveAppData(data);
  return data;
}

export function saveInsights(insights: InsightIdea[]): AppData {
  const data = loadAppDataLocal();
  data.insights = normalizeInsights(insights);
  saveAppData(data);
  return data;
}

export function exportMapMarkdown(): string {
  const { map, notes, insights } = loadAppDataLocal();
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
  void fetch("/api/data", { method: "DELETE" }).catch(() => {});
}
