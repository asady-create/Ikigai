"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Wand2 } from "lucide-react";
import type { PurposeMap } from "@/lib/types";
import {
  createEmptyMap,
  generateSynthesis,
  normalizeMap,
} from "@/lib/synthesis";
import { useIkigai } from "@/components/providers/ikigai-provider";
import { IkigaiCanvas } from "@/components/map/ikigai-canvas";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function PurposeMapPage() {
  const { ready, data, upsertMap } = useIkigai();
  const [map, setMap] = useState<PurposeMap>(createEmptyMap);
  const [savedFlash, setSavedFlash] = useState(false);
  const hydrated = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapRef = useRef(map);
  mapRef.current = map;

  useEffect(() => {
    if (!ready || hydrated.current) return;
    setMap(normalizeMap(data.map));
    hydrated.current = true;
  }, [ready, data.map]);

  const persist = useCallback(
    (next: PurposeMap, immediate = false) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      const write = () => {
        upsertMap({ ...next, updatedAt: new Date().toISOString() });
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1200);
      };
      if (immediate) write();
      else saveTimer.current = setTimeout(write, 200);
    },
    [upsertMap]
  );

  const updateField = (
    key: keyof Pick<
      PurposeMap,
      "want" | "goodAt" | "need" | "reward" | "offer" | "synthesis"
    >,
    value: string
  ) => {
    setMap((prev) => {
      const next = { ...prev, [key]: value };
      persist(next);
      return next;
    });
  };

  const flushNow = () => persist(mapRef.current, true);

  const handleGenerate = () => {
    const statement = generateSynthesis(map);
    if (!statement) return;
    updateField("synthesis", statement);
  };

  if (!ready) {
    return (
      <div className="animate-pulse space-y-4 py-8">
        <div className="h-8 w-40 rounded bg-[var(--surface-2)]" />
        <div className="aspect-square max-w-lg rounded-2xl bg-[var(--surface-2)]" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
            Map
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Reflect on four areas
          </h1>
          <p className="mt-2 max-w-lg text-sm text-[var(--muted)]">
            Type on the ikigai diagram. Each circle is one question. Your
            answers save in this browser.
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-xs transition-opacity",
            savedFlash
              ? "text-[var(--accent)] opacity-100"
              : "text-[var(--muted)] opacity-50"
          )}
        >
          <Check className="size-3.5" />
          Saved locally
        </span>
      </header>

      <IkigaiCanvas
        map={map}
        onChange={(field, value) => updateField(field, value)}
        onBlurSave={flushNow}
      />

      <p className="text-center text-xs text-[var(--muted)]">
        Skill inventory lives on{" "}
        <Link href="/skills" className="text-[var(--accent)] hover:underline">
          Skills
        </Link>
        . Overlaps open in{" "}
        <Link
          href="/insights"
          className="inline-flex items-center gap-0.5 text-[var(--accent)] hover:underline"
        >
          Insights
          <ArrowRight className="size-3" />
        </Link>
      </p>

      <motion.section
        id="synthesis"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="scroll-mt-24 border-t border-[var(--border)] pt-10"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-[var(--foreground)]">
              Synthesis
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              A plain summary of the four circles. Edit freely.
            </p>
          </div>
          <Button variant="accent" onClick={handleGenerate}>
            <Wand2 />
            Build from diagram
          </Button>
        </div>
        <Textarea
          value={map.synthesis}
          onChange={(e) => updateField("synthesis", e.target.value)}
          onBlur={flushNow}
          placeholder="Fill the circles, then build a synthesis — or write your own."
          className="mt-5 min-h-[140px] font-display text-base leading-relaxed"
          aria-label="Synthesis"
        />
      </motion.section>
    </div>
  );
}
