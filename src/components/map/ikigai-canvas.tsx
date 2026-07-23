"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PurposeMap } from "@/lib/types";
import {
  CENTER_PROMPT,
  CIRCLE_PROMPTS,
  type CircleId,
} from "@/lib/reflection-prompts";
import { cn } from "@/lib/utils";

type FieldKey = "want" | "goodAt" | "need" | "reward";

const ZONE_LAYOUT: Record<
  CircleId,
  { className: string; accent: string }
> = {
  love: {
    className: "left-[2%] top-[2%] h-[46%] w-[46%]",
    accent: "rgba(13, 92, 99, 0.55)",
  },
  goodAt: {
    className: "right-[2%] top-[2%] h-[46%] w-[46%]",
    accent: "rgba(37, 99, 120, 0.5)",
  },
  need: {
    className: "left-[2%] bottom-[2%] h-[46%] w-[46%]",
    accent: "rgba(71, 85, 105, 0.45)",
  },
  reward: {
    className: "right-[2%] bottom-[2%] h-[46%] w-[46%]",
    accent: "rgba(15, 118, 110, 0.5)",
  },
};

function DiagramBackdrop({ active }: { active: CircleId | "center" | null }) {
  const dim = (id: CircleId) =>
    active && active !== id && active !== "center" ? 0.35 : 1;

  return (
    <svg
      viewBox="0 0 400 400"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    >
      <circle
        cx="155"
        cy="155"
        r="118"
        fill="rgba(13, 92, 99, 0.16)"
        stroke="rgba(13, 92, 99, 0.55)"
        strokeWidth="1.75"
        style={{ opacity: dim("love") }}
      />
      <circle
        cx="245"
        cy="155"
        r="118"
        fill="rgba(37, 99, 120, 0.14)"
        stroke="rgba(37, 99, 120, 0.5)"
        strokeWidth="1.75"
        style={{ opacity: dim("goodAt") }}
      />
      <circle
        cx="155"
        cy="245"
        r="118"
        fill="rgba(71, 85, 105, 0.12)"
        stroke="rgba(71, 85, 105, 0.45)"
        strokeWidth="1.75"
        style={{ opacity: dim("need") }}
      />
      <circle
        cx="245"
        cy="245"
        r="118"
        fill="rgba(15, 118, 110, 0.14)"
        stroke="rgba(15, 118, 110, 0.5)"
        strokeWidth="1.75"
        style={{ opacity: dim("reward") }}
      />
      <circle
        cx="200"
        cy="200"
        r="48"
        fill={
          active === "center"
            ? "rgba(13, 92, 99, 0.22)"
            : "rgba(13, 92, 99, 0.12)"
        }
        stroke="rgba(13, 92, 99, 0.35)"
        strokeWidth="1.25"
      />
    </svg>
  );
}

interface IkigaiCanvasProps {
  map: PurposeMap;
  onChange: (field: FieldKey | "offer", value: string) => void;
  onBlurSave?: () => void;
}

export function IkigaiCanvas({ map, onChange, onBlurSave }: IkigaiCanvasProps) {
  const [active, setActive] = useState<CircleId | "center" | null>(null);
  const activePrompt =
    active && active !== "center"
      ? CIRCLE_PROMPTS.find((p) => p.id === active)
      : null;

  return (
    <div className="space-y-5">
      {/* Prompt strip — updates as you focus a circle */}
      <div className="min-h-[4.5rem] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 sm:px-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={active ?? "idle"}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {active === "center" ? (
              <>
                <p className="text-xs font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
                  {CENTER_PROMPT.label}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--foreground)]">
                  {CENTER_PROMPT.prompt}
                </p>
              </>
            ) : activePrompt ? (
              <>
                <p className="text-xs font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
                  {activePrompt.label}
                  <span className="ml-2 font-normal tracking-normal text-[var(--muted)] normal-case">
                    {activePrompt.japaneseHint}
                  </span>
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--foreground)]">
                  {activePrompt.prompt}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {activePrompt.followUp}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
                  Reflect on the diagram
                </p>
                <p className="mt-1.5 text-sm text-[var(--muted)]">
                  Tap a circle and write directly on it. Each area has one
                  precise question.
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Interactive diagram */}
      <div
        className={cn(
          "relative mx-auto w-full max-w-[640px]",
          "aspect-square overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)]"
        )}
      >
        <DiagramBackdrop active={active} />

        {CIRCLE_PROMPTS.map((circle) => {
          const layout = ZONE_LAYOUT[circle.id];
          const value = map[circle.field];
          const isActive = active === circle.id;
          return (
            <div
              key={circle.id}
              className={cn(
                "absolute z-10 flex flex-col p-2.5 sm:p-3.5",
                layout.className
              )}
            >
              <label
                htmlFor={`circle-${circle.id}`}
                className={cn(
                  "mb-1 shrink-0 text-[10px] font-semibold tracking-[0.12em] uppercase sm:text-xs",
                  isActive ? "text-[var(--accent)]" : "text-[var(--foreground)]/80"
                )}
              >
                {circle.label}
              </label>
              <textarea
                id={`circle-${circle.id}`}
                value={value}
                onChange={(e) => onChange(circle.field, e.target.value)}
                onFocus={() => setActive(circle.id)}
                onBlur={() => {
                  setActive((a) => (a === circle.id ? null : a));
                  onBlurSave?.();
                }}
                placeholder={circle.placeholder}
                className={cn(
                  "min-h-0 flex-1 resize-none rounded-xl border px-2.5 py-2 text-xs leading-snug sm:text-sm sm:leading-relaxed",
                  "bg-white/80 text-[var(--foreground)] shadow-sm backdrop-blur-sm",
                  "placeholder:text-[var(--muted)]/55",
                  "focus:bg-white/95 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/35",
                  isActive
                    ? "border-[var(--accent)]/50"
                    : "border-white/60 hover:border-[var(--border)]"
                )}
              />
            </div>
          );
        })}

        {/* Center — offer / deliver (typeable) */}
        <div className="absolute top-1/2 left-1/2 z-20 flex w-[42%] max-w-[15rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center sm:w-[38%] sm:max-w-[16rem]">
          <span
            className={cn(
              "mb-1 rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-[0.12em] text-white uppercase sm:text-[10px]",
              "bg-[var(--accent)]/90"
            )}
          >
            生き甲斐 · Deliver
          </span>
          <textarea
            id="circle-center"
            value={map.offer}
            onChange={(e) => onChange("offer", e.target.value)}
            onFocus={() => setActive("center")}
            onBlur={() => {
              setActive((a) => (a === "center" ? null : a));
              onBlurSave?.();
            }}
            placeholder={CENTER_PROMPT.placeholder}
            aria-label={CENTER_PROMPT.label}
            rows={4}
            className={cn(
              "min-h-[5.5rem] w-full resize-none rounded-2xl border px-3 py-2.5 text-center text-xs leading-snug sm:min-h-[6.5rem] sm:text-sm sm:leading-relaxed",
              "bg-white/95 text-[var(--foreground)] shadow-md backdrop-blur-sm",
              "placeholder:text-[var(--muted)]/45",
              "focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40",
              active === "center"
                ? "border-[var(--accent)]"
                : "border-[var(--accent)]/35"
            )}
          />
        </div>
      </div>

      {/* Expanded editor when a zone (or center) is active — easier typing */}
      <AnimatePresence>
        {(activePrompt || active === "center") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="mb-2 text-xs text-[var(--muted)]">
              {active === "center"
                ? "Expanded — what you deliver (center)"
                : `Expanded — ${activePrompt?.label}`}
            </p>
            <textarea
              value={
                active === "center" ? map.offer : map[activePrompt!.field]
              }
              onChange={(e) =>
                onChange(
                  active === "center" ? "offer" : activePrompt!.field,
                  e.target.value
                )
              }
              onBlur={() => onBlurSave?.()}
              placeholder={
                active === "center"
                  ? CENTER_PROMPT.placeholder
                  : activePrompt!.placeholder
              }
              className="min-h-[120px] w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm leading-relaxed"
              autoFocus={false}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Static diagram for Overview — links into Map. */
export function IkigaiDiagramStatic() {
  return (
    <figure className="w-full">
      <figcaption className="mb-4">
        <p className="font-display text-sm font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
          Japanese ikigai
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          生き甲斐 — a reason for being. Write on the four circles in Map.
        </p>
      </figcaption>
      <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <DiagramBackdrop active={null} />
        <ul className="absolute inset-0 grid grid-cols-2 grid-rows-2 p-4 text-center text-xs font-semibold text-[var(--foreground)]/80">
          <li className="flex items-start justify-start p-2">What you love</li>
          <li className="flex items-start justify-end p-2">What you’re good at</li>
          <li className="flex items-end justify-start p-2">What the world needs</li>
          <li className="flex items-end justify-end p-2">What you can be paid for</li>
        </ul>
      </div>
    </figure>
  );
}
