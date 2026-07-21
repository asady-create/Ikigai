/**
 * Local-storage persistence layer — privacy-first, no backend.
 * All app data lives in the browser under a single namespaced key.
 */

import type {
  AppData,
  Goal,
  InsightResult,
  PurposeCanvas,
  ReflectionEntry,
  StreakData,
} from "./types";

const STORAGE_KEY = "ikigai:v1";

const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastReflectionDate: null,
  totalReflections: 0,
};

const DEFAULT_DATA: AppData = {
  reflections: [],
  goals: [],
  canvas: null,
  streak: DEFAULT_STREAK,
  insights: null,
};

function isBrowser() {
  return typeof window !== "undefined";
}

/** Read full app state from localStorage. */
export function loadAppData(): AppData {
  if (!isBrowser()) return structuredClone(DEFAULT_DATA);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_DATA);
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      ...structuredClone(DEFAULT_DATA),
      ...parsed,
      streak: { ...DEFAULT_STREAK, ...parsed.streak },
      reflections: parsed.reflections ?? [],
      goals: parsed.goals ?? [],
    };
  } catch {
    console.warn("[ikigai] Failed to parse localStorage — resetting.");
    return structuredClone(DEFAULT_DATA);
  }
}

/** Persist full app state. */
export function saveAppData(data: AppData): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Calendar date key YYYY-MM-DD in local time. */
function dateKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateKey(d);
}

/** Update streak after a new reflection. */
export function computeStreak(
  streak: StreakData,
  reflectionDate = new Date()
): StreakData {
  const today = dateKey(reflectionDate);
  const last = streak.lastReflectionDate;

  let currentStreak = streak.currentStreak;
  if (last === today) {
    // Already counted today — keep streak.
  } else if (last === yesterdayKey() || last === dateKey(new Date(reflectionDate.getTime() - 86_400_000))) {
    currentStreak = streak.currentStreak + 1;
  } else {
    currentStreak = 1;
  }

  return {
    currentStreak,
    longestStreak: Math.max(streak.longestStreak, currentStreak),
    lastReflectionDate: today,
    totalReflections: streak.totalReflections + 1,
  };
}

// ── Reflection helpers ─────────────────────────────────────

export function getReflections(): ReflectionEntry[] {
  return loadAppData().reflections.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function saveReflection(entry: ReflectionEntry): AppData {
  const data = loadAppData();
  const idx = data.reflections.findIndex((r) => r.id === entry.id);
  const isNew = idx === -1;

  if (isNew) {
    data.reflections.push(entry);
    data.streak = computeStreak(data.streak, new Date(entry.createdAt));
  } else {
    data.reflections[idx] = entry;
  }

  saveAppData(data);
  return data;
}

export function deleteReflection(id: string): AppData {
  const data = loadAppData();
  data.reflections = data.reflections.filter((r) => r.id !== id);
  saveAppData(data);
  return data;
}

export function getStreak(): StreakData {
  return loadAppData().streak;
}

export function saveInsights(insights: InsightResult): AppData {
  const data = loadAppData();
  data.insights = insights;
  saveAppData(data);
  return data;
}

export function getInsights(): InsightResult | null {
  return loadAppData().insights;
}

// ── Goals / Canvas stubs (ready for later pages) ───────────

export function getGoals(): Goal[] {
  return loadAppData().goals;
}

export function saveGoals(goals: Goal[]): void {
  const data = loadAppData();
  data.goals = goals;
  saveAppData(data);
}

export function getCanvas(): PurposeCanvas | null {
  return loadAppData().canvas;
}

export function saveCanvas(canvas: PurposeCanvas): void {
  const data = loadAppData();
  data.canvas = canvas;
  saveAppData(data);
}

/** Export all reflections as Markdown. */
export function exportReflectionsMarkdown(): string {
  const reflections = getReflections();
  const lines = [
    "# Ikigai Journal",
    "",
    `_Exported ${new Date().toLocaleString()}_`,
    "",
    "---",
    "",
  ];

  for (const r of reflections) {
    lines.push(`## ${r.promptText}`);
    lines.push("");
    lines.push(`*${new Date(r.createdAt).toLocaleString()} · Theme: ${r.theme} · Energy ${r.energy}/10 · Clarity ${r.clarity}/10*`);
    lines.push("");
    lines.push(r.content || "_(empty)_");
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

/** Trigger a browser download of Markdown journal. */
export function downloadMarkdown(filename = "ikigai-journal.md"): void {
  if (!isBrowser()) return;
  const md = exportReflectionsMarkdown();
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Print-friendly PDF via browser print dialog. */
export function exportPdfViaPrint(): void {
  if (!isBrowser()) return;
  window.print();
}

/** Clear all local data — use carefully. */
export function resetAllData(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}
