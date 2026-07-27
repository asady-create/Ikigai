/**
 * Server-side file store — data lives on disk in the project folder.
 * Path: <project>/data/ikigai-store.json
 *
 * Every write:
 * 1) Rotates a previous backup (ikigai-store.prev.json)
 * 2) Keeps a small history (ikigai-store.bak-*.json)
 * 3) Merges via protectAgainstLoss so reloads cannot wipe content
 */

import { promises as fs } from "fs";
import path from "path";
import type { AppData } from "./types";
import { DEFAULT_TIMELINE_AREAS } from "./timeline";
import {
  EMPTY_APP_DATA,
  protectAgainstLoss,
} from "./data-safety";

export const DISK_FILENAME = "ikigai-store.json";
export const PREV_FILENAME = "ikigai-store.prev.json";
const MAX_HISTORY = 5;

export function getDataDir(): string {
  return path.join(process.cwd(), "data");
}

export function getStorePath(): string {
  return path.join(getDataDir(), DISK_FILENAME);
}

export function getPrevPath(): string {
  return path.join(getDataDir(), PREV_FILENAME);
}

const EMPTY: AppData = {
  ...EMPTY_APP_DATA,
  timelineAreas: DEFAULT_TIMELINE_AREAS.map((a) => ({ ...a })),
};

function normalizeDisk(parsed: Partial<AppData>): AppData {
  return {
    ...EMPTY,
    ...parsed,
    map: parsed.map ?? null,
    notes: parsed.notes ?? [],
    insights: parsed.insights ?? [],
    timeline: parsed.timeline ?? [],
    timelineAreas:
      parsed.timelineAreas ??
      DEFAULT_TIMELINE_AREAS.map((a) => ({ ...a })),
    revision: parsed.revision ?? 0,
  };
}

export async function readDiskStore(): Promise<AppData | null> {
  try {
    const raw = await fs.readFile(getStorePath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return normalizeDisk(parsed);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return null;
    console.warn("[ikigai] Failed to read disk store", err);
    return null;
  }
}

async function rotateHistory(dir: string, currentRaw: string): Promise<void> {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const historyPath = path.join(dir, `ikigai-store.bak-${stamp}.json`);
  try {
    await fs.writeFile(historyPath, currentRaw, "utf8");
  } catch (err) {
    console.warn("[ikigai] Failed to write history backup", err);
    return;
  }

  try {
    const files = (await fs.readdir(dir))
      .filter((f) => f.startsWith("ikigai-store.bak-") && f.endsWith(".json"))
      .sort();
    const excess = files.length - MAX_HISTORY;
    for (let i = 0; i < excess; i++) {
      await fs.unlink(path.join(dir, files[i]!)).catch(() => {});
    }
  } catch {
    /* ignore cleanup errors */
  }
}

async function backupCurrent(dir: string): Promise<void> {
  const store = getStorePath();
  try {
    const raw = await fs.readFile(store, "utf8");
    await fs.writeFile(getPrevPath(), raw, "utf8");
    await rotateHistory(dir, raw);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      console.warn("[ikigai] Failed to backup disk store", err);
    }
  }
}

/**
 * Safe write: backup → protect against loss → atomic rename.
 */
export async function writeDiskStore(
  data: AppData,
  opts: { force?: boolean } = {}
): Promise<{ data: AppData; protected: boolean; reason?: string }> {
  const dir = getDataDir();
  await fs.mkdir(dir, { recursive: true });

  const existing = await readDiskStore();
  const result = opts.force
    ? { data, protected: false as boolean, reason: undefined as string | undefined }
    : protectAgainstLoss(existing, data);

  await backupCurrent(dir);

  const tmp = `${getStorePath()}.tmp`;
  const json = JSON.stringify(result.data, null, 2);
  await fs.writeFile(tmp, json, "utf8");
  await fs.rename(tmp, getStorePath());

  if (result.protected) {
    console.warn(
      `[ikigai] Disk write protected (${result.reason ?? "merged"}) — existing content kept where needed.`
    );
  }

  return result;
}

export async function clearDiskStore(): Promise<void> {
  // Keep a final backup before clearing
  try {
    await backupCurrent(getDataDir());
  } catch {
    /* ignore */
  }
  try {
    await fs.unlink(getStorePath());
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw err;
  }
}
