import { NextResponse } from "next/server";
import type { AppData } from "@/lib/types";
import {
  clearDiskStore,
  getStorePath,
  readDiskStore,
  writeDiskStore,
} from "@/lib/disk-store";
import { isEffectivelyEmpty } from "@/lib/data-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await readDiskStore();
  return NextResponse.json({
    data: data ?? {
      map: null,
      notes: [],
      insights: [],
      timeline: [],
      timelineAreas: [],
      revision: 0,
    },
    path: getStorePath(),
    exists: data !== null,
  });
}

async function save(req: Request) {
  let body: AppData;
  try {
    body = (await req.json()) as AppData;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const incoming: AppData = {
    map: body.map ?? null,
    notes: body.notes ?? [],
    insights: body.insights ?? [],
    timeline: body.timeline ?? [],
    timelineAreas: body.timelineAreas ?? [],
    revision: body.revision ?? 0,
  };

  // force only via explicit header (used by reset flows — not by normal saves)
  const force =
    req.headers.get("x-ikigai-force") === "1" &&
    req.headers.get("x-ikigai-confirm-reset") === "1";

  if (!force && isEffectivelyEmpty(incoming)) {
    const existing = await readDiskStore();
    if (existing && !isEffectivelyEmpty(existing)) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "empty_overwrite_blocked",
        path: getStorePath(),
      });
    }
  }

  const result = await writeDiskStore(incoming, { force });
  return NextResponse.json({
    ok: true,
    path: getStorePath(),
    protected: result.protected,
    reason: result.reason,
    revision: result.data.revision ?? 0,
  });
}

export async function PUT(req: Request) {
  return save(req);
}

/** sendBeacon uses POST */
export async function POST(req: Request) {
  return save(req);
}

export async function DELETE() {
  await clearDiskStore();
  return NextResponse.json({ ok: true });
}
