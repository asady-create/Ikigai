"use client";

import { motion } from "framer-motion";

/**
 * Classic Japanese ikigai — four overlapping circles.
 * Used as a reference so the prompts that follow can be refined against it.
 */
export function IkigaiDiagram() {
  return (
    <figure className="w-full">
      <figcaption className="mb-4">
        <p className="font-display text-sm font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
          Japanese ikigai
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          生き甲斐 — a reason for being. The center is where four questions meet.
          Use this to check whether your answers below actually overlap.
        </p>
      </figcaption>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-md"
      >
        <svg
          viewBox="0 0 400 400"
          role="img"
          aria-label="Ikigai diagram: four overlapping circles — love, good at, world needs, paid for"
          className="h-auto w-full"
        >
          {/* Circles — soft overlap */}
          <circle
            cx="160"
            cy="155"
            r="105"
            fill="rgba(13, 92, 99, 0.14)"
            stroke="rgba(13, 92, 99, 0.55)"
            strokeWidth="1.5"
          />
          <circle
            cx="240"
            cy="155"
            r="105"
            fill="rgba(37, 99, 120, 0.12)"
            stroke="rgba(37, 99, 120, 0.5)"
            strokeWidth="1.5"
          />
          <circle
            cx="160"
            cy="245"
            r="105"
            fill="rgba(71, 85, 105, 0.1)"
            stroke="rgba(71, 85, 105, 0.45)"
            strokeWidth="1.5"
          />
          <circle
            cx="240"
            cy="245"
            r="105"
            fill="rgba(15, 118, 110, 0.12)"
            stroke="rgba(15, 118, 110, 0.5)"
            strokeWidth="1.5"
          />

          {/* Center marker */}
          <circle cx="200" cy="200" r="22" fill="rgba(13, 92, 99, 0.85)" />
          <text
            x="200"
            y="204"
            textAnchor="middle"
            className="fill-white"
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em" }}
          >
            生き甲斐
          </text>

          {/* Outer labels */}
          <text
            x="95"
            y="95"
            textAnchor="middle"
            style={{
              fontSize: 12,
              fontWeight: 600,
              fill: "#12141a",
            }}
          >
            What you love
          </text>
          <text
            x="305"
            y="95"
            textAnchor="middle"
            style={{
              fontSize: 12,
              fontWeight: 600,
              fill: "#12141a",
            }}
          >
            What you’re good at
          </text>
          <text
            x="90"
            y="325"
            textAnchor="middle"
            style={{
              fontSize: 12,
              fontWeight: 600,
              fill: "#12141a",
            }}
          >
            What the world needs
          </text>
          <text
            x="310"
            y="325"
            textAnchor="middle"
            style={{
              fontSize: 12,
              fontWeight: 600,
              fill: "#12141a",
            }}
          >
            What you can be paid for
          </text>

          {/* Intersection hints (small) */}
          <text
            x="200"
            y="128"
            textAnchor="middle"
            style={{ fontSize: 9, fill: "#5c6370" }}
          >
            passion
          </text>
          <text
            x="200"
            y="278"
            textAnchor="middle"
            style={{ fontSize: 9, fill: "#5c6370" }}
          >
            vocation
          </text>
          <text
            x="108"
            y="205"
            textAnchor="middle"
            style={{ fontSize: 9, fill: "#5c6370" }}
          >
            mission
          </text>
          <text
            x="292"
            y="205"
            textAnchor="middle"
            style={{ fontSize: 9, fill: "#5c6370" }}
          >
            profession
          </text>
        </svg>
      </motion.div>

      <ul className="mt-5 grid gap-2 text-sm text-[var(--muted)] sm:grid-cols-2">
        <li>
          <span className="font-medium text-[var(--foreground)]">Love</span> →
          what you want
        </li>
        <li>
          <span className="font-medium text-[var(--foreground)]">Good at</span> →
          skills you have / lack
        </li>
        <li>
          <span className="font-medium text-[var(--foreground)]">World needs</span>{" "}
          → who needs what you deliver
        </li>
        <li>
          <span className="font-medium text-[var(--foreground)]">Paid for</span> →
          how you’re rewarded
        </li>
      </ul>
    </figure>
  );
}
