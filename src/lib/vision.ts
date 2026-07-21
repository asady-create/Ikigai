import type { IkigaiCanvas } from "./types";

/**
 * Generate a one-paragraph vision statement from Ikigai quadrants + values.
 * Local / rule-based for MVP — swap for an LLM later if desired.
 */
export function generateVisionStatement(
  ikigai: IkigaiCanvas,
  values: string[]
): string {
  const love = clean(ikigai.love) || "work that lights you up";
  const goodAt = clean(ikigai.goodAt) || "skills you're sharpening into a real edge";
  const worldNeeds =
    clean(ikigai.worldNeeds) || "problems the world still underestimates";
  const paidFor =
    clean(ikigai.paidFor) || "ways the market already rewards adjacent craft";

  const valuesClause =
    values.length > 0
      ? ` Guided by ${formatList(values)}, you refuse half-measures.`
      : " You refuse half-measures.";

  return (
    `You are building a life at the intersection of what you love — ${love} — ` +
    `and what you're becoming unusually good at — ${goodAt}. ` +
    `You aim that combination at what the world needs — ${worldNeeds} — ` +
    `in forms you can be paid for — ${paidFor}.` +
    valuesClause +
    ` The world is malleable: with clarity, maximum energy, and calculated risk, ` +
    `you move to the center of the action and let opportunity reconfigure around you.`
  );
}

function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim().replace(/[.]+$/, "");
}

function formatList(items: string[]): string {
  const cleaned = items.map((v) => v.trim()).filter(Boolean);
  if (cleaned.length === 1) return cleaned[0];
  if (cleaned.length === 2) return `${cleaned[0]} and ${cleaned[1]}`;
  return `${cleaned.slice(0, -1).join(", ")}, and ${cleaned[cleaned.length - 1]}`;
}

/** Default empty canvas used on first visit. */
export function createEmptyCanvas() {
  return {
    wheel: {
      career: 5,
      skills: 5,
      impact: 5,
      energy: 5,
      relationships: 5,
      creativity: 5,
      adventure: 5,
      wealth: 5,
    },
    ikigai: {
      love: "",
      goodAt: "",
      worldNeeds: "",
      paidFor: "",
    },
    values: [] as string[],
    visionStatement: "",
    updatedAt: new Date().toISOString(),
  };
}
