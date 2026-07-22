/**
 * localStorage persistence — private, browser-only.
 */

import type {
  AppData,
  InsightIdea,
  Note,
  NoteTag,
  PurposeMap,
} from "./types";
import { NOTE_TAGS } from "./types";
import { createEmptyMap } from "./synthesis";
import { isNoteTag } from "./note-tags";

const STORAGE_KEY = "ikigai:v2";
const LEGACY_KEY = "ikigai:v1";

const DEFAULT_DATA: AppData = {
  map: null,
  notes: [],
  insights: [],
};

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeNote(raw: Partial<Note> & { id: string; content: string }): Note {
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

/** Migrate old canvas shape into PurposeMap if present. */
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
    saveAppData(data);
    window.localStorage.removeItem(LEGACY_KEY);
    return data;
  } catch {
    return null;
  }
}

export function loadAppData(): AppData {
  if (!isBrowser()) return structuredClone(DEFAULT_DATA);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return migrateLegacy() ?? structuredClone(DEFAULT_DATA);
    }
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      ...structuredClone(DEFAULT_DATA),
      ...parsed,
      map: parsed.map ?? null,
      notes: (parsed.notes ?? []).map((n) => normalizeNote(n)),
      insights: parsed.insights ?? [],
    };
  } catch {
    console.warn("[ikigai] Failed to parse localStorage — resetting.");
    return structuredClone(DEFAULT_DATA);
  }
}

export function saveAppData(data: AppData): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getMap(): PurposeMap | null {
  return loadAppData().map;
}

export function saveMap(map: PurposeMap): AppData {
  const data = loadAppData();
  data.map = { ...map, updatedAt: new Date().toISOString() };
  saveAppData(data);
  return data;
}

export function getNotes(): Note[] {
  return loadAppData().notes.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function saveNote(note: Note): AppData {
  const data = loadAppData();
  const normalized = normalizeNote(note);
  const idx = data.notes.findIndex((n) => n.id === normalized.id);
  if (idx === -1) data.notes.push(normalized);
  else data.notes[idx] = normalized;
  saveAppData(data);
  return data;
}

export function deleteNote(id: string): AppData {
  const data = loadAppData();
  data.notes = data.notes.filter((n) => n.id !== id);
  saveAppData(data);
  return data;
}

export function saveInsights(insights: InsightIdea[]): AppData {
  const data = loadAppData();
  data.insights = insights;
  saveAppData(data);
  return data;
}

export function exportMapMarkdown(): string {
  const { map, notes, insights } = loadAppData();
  const lines = [
    "# Ikigai 2.0",
    "",
    `_Exported ${new Date().toLocaleString()}_`,
    "",
  ];

  if (map) {
    lines.push("## What I want", "", map.want || "—", "");
    lines.push("## What I will deliver", "", map.offer || "—", "");
    lines.push("## Who needs it", "", map.need || "—", "");
    lines.push("## How I want to be rewarded", "", map.reward || "—", "");
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
  window.localStorage.removeItem(LEGACY_KEY);
}
