import type {
  InsightConnectionId,
  InsightIdea,
  PurposeMap,
  Skill,
} from "./types";
import { nanoid } from "nanoid";

function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim().replace(/[.]+$/, "");
}

function clip(s: string, max = 120): string {
  const c = clean(s);
  if (c.length <= max) return c;
  return `${c.slice(0, max - 1).trim()}…`;
}

function skillList(skills: Skill[], max = 3): string {
  return skills
    .map((s) => s.name.trim())
    .filter(Boolean)
    .slice(0, max)
    .join(", ");
}

export interface InsightConnection {
  id: InsightConnectionId;
  /** e.g. "What I Want + Who Needs It" */
  formula: string;
  /** e.g. "Potential purpose areas" */
  result: string;
  /** True when both sides of the overlap have content. */
  ready: (map: PurposeMap | null) => boolean;
  /** Generate up to a few seed ideas from the map. */
  generate: (map: PurposeMap) => string[];
}

export const INSIGHT_CONNECTIONS: InsightConnection[] = [
  {
    id: "want-need",
    formula: "What I Want + Who Needs It",
    result: "Potential purpose areas",
    ready: (m) => Boolean(m && clean(m.want) && clean(m.need)),
    generate: (m) => {
      const want = clip(m.want, 90);
      const need = clip(m.need, 90);
      return [
        `Serve “${need}” by pursuing “${want}”.`,
        `Purpose bet: turn what you want (${want}) into relief for who needs it (${need}).`,
        `Ask: what smallest version of “${want}” helps “${need}” this month?`,
      ];
    },
  },
  {
    id: "offer-need",
    formula: "What I Deliver + Who Needs It",
    result: "Offer fit",
    ready: (m) => Boolean(m && clean(m.offer) && clean(m.need)),
    generate: (m) => {
      const offer = clip(m.offer, 90);
      const need = clip(m.need, 90);
      return [
        `Package “${offer}” for “${need}”.`,
        `Validate: would “${need}” choose “${offer}” over doing nothing?`,
        `Narrow the offer until one clear user in “${need}” would use it weekly.`,
      ];
    },
  },
  {
    id: "offer-reward",
    formula: "What I Deliver + How I’m Rewarded",
    result: "Viable exchange",
    ready: (m) => Boolean(m && clean(m.offer) && clean(m.reward)),
    generate: (m) => {
      const offer = clip(m.offer, 90);
      const reward = clip(m.reward, 90);
      return [
        `Exchange: deliver “${offer}” → receive “${reward}”.`,
        `Price or structure the work so “${reward}” is the natural outcome of “${offer}”.`,
        `Cut any version of the offer that cannot produce “${reward}”.`,
      ];
    },
  },
  {
    id: "have-need",
    formula: "Skills I Have + Who Needs It",
    result: "Where you can help now",
    ready: (m) =>
      Boolean(m && m.skillsHave.some((s) => s.name.trim()) && clean(m.need)),
    generate: (m) => {
      const have = skillList(m.skillsHave) || "your current skills";
      const need = clip(m.need, 90);
      return [
        `Apply ${have} toward “${need}” without waiting on new skills.`,
        `Lead with ${have} — that’s the shortest path into “${need}”.`,
      ];
    },
  },
  {
    id: "want-gap",
    formula: "What I Want + Skills I Lack",
    result: "Gaps to close",
    ready: (m) =>
      Boolean(m && clean(m.want) && m.skillsLack.some((s) => s.name.trim())),
    generate: (m) => {
      const want = clip(m.want, 90);
      const gaps = skillList(m.skillsLack) || "the skills you listed";
      return [
        `To reach “${want}”, close: ${gaps}.`,
        `Priority learning for “${want}”: ${gaps}.`,
        `Block time this week on the highest-leverage gap among: ${gaps}.`,
      ];
    },
  },
];

export function getConnection(id: InsightConnectionId): InsightConnection {
  const found = INSIGHT_CONNECTIONS.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown connection: ${id}`);
  return found;
}

/**
 * Auto-generate 3–5 insight ideas from filled map overlaps.
 * Skips connections that aren't ready. Caps total ideas.
 */
export function generateInsightIdeas(
  map: PurposeMap | null,
  maxIdeas = 5
): InsightIdea[] {
  if (!map) return [];
  const now = new Date().toISOString();
  const ideas: InsightIdea[] = [];

  for (const conn of INSIGHT_CONNECTIONS) {
    if (ideas.length >= maxIdeas) break;
    if (!conn.ready(map)) continue;
    const texts = conn.generate(map);
    for (const text of texts) {
      if (ideas.length >= maxIdeas) break;
      ideas.push({
        id: nanoid(10),
        connectionId: conn.id,
        text,
        source: "auto",
        createdAt: now,
      });
    }
  }

  return ideas.slice(0, maxIdeas);
}

/** Replace auto ideas; keep manual ones. */
export function mergeAutoInsights(
  existing: InsightIdea[],
  generated: InsightIdea[]
): InsightIdea[] {
  const manual = existing.filter((i) => i.source === "manual");
  return [...generated, ...manual];
}
