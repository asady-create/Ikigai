/**
 * Marc Andreessen / pmarca-inspired quotes & mindset lines.
 * Rotate these across Home, Reflections, and Coach screens.
 */

export interface Quote {
  id: string;
  text: string;
  attribution: string;
  /** Optional context for where this quote lands best. */
  vibe: "malleable" | "action" | "skills" | "risk" | "energy" | "career" | "opportunity";
}

export const QUOTES: Quote[] = [
  {
    id: "q1",
    text: "The world is a very malleable place. If you know what you want, and you want it badly enough while you are capable of speaking clearly and passionately about it, the world will reconfigure itself around you.",
    attribution: "Marc Andreessen",
    vibe: "malleable",
  },
  {
    id: "q2",
    text: "Don't rigidly plan your career. Instead, develop skills, pursue opportunities, and treat your path as a dynamic portfolio of experiences.",
    attribution: "pmarca mindset",
    vibe: "career",
  },
  {
    id: "q3",
    text: "Go to the center of the action. That's where the opportunities compound.",
    attribution: "pmarca mindset",
    vibe: "action",
  },
  {
    id: "q4",
    text: "Become a double threat — then a triple threat. Stack rare skills until the market has no choice but to notice.",
    attribution: "pmarca mindset",
    vibe: "skills",
  },
  {
    id: "q5",
    text: "Calculated risk-taking isn't recklessness. It's the cost of admission to asymmetric upside.",
    attribution: "pmarca mindset",
    vibe: "risk",
  },
  {
    id: "q6",
    text: "Maximum energy, drive, and passion. Half-measures reconfigure nothing.",
    attribution: "pmarca mindset",
    vibe: "energy",
  },
  {
    id: "q7",
    text: "Clarity without action is just journaling. Act on what you know — then refine.",
    attribution: "Ikigai / pmarca",
    vibe: "action",
  },
  {
    id: "q8",
    text: "The conventional path optimizes for comfort. The interesting path optimizes for agency.",
    attribution: "pmarca mindset",
    vibe: "career",
  },
  {
    id: "q9",
    text: "Opportunity is created by people who show up with skills and intensity — not by waiting for permission.",
    attribution: "pmarca mindset",
    vibe: "opportunity",
  },
  {
    id: "q10",
    text: "Your life is a portfolio. Rebalance toward high-upside bets. Cut low-energy holdings.",
    attribution: "Ikigai / pmarca",
    vibe: "career",
  },
];

export function getQuoteByVibe(vibe: Quote["vibe"]): Quote {
  const matches = QUOTES.filter((q) => q.vibe === vibe);
  const pool = matches.length ? matches : QUOTES;
  const idx = Math.floor(Date.now() / 86_400_000) % pool.length;
  return pool[idx];
}

export function getRotatingQuote(offset = 0): Quote {
  const idx = (Math.floor(Date.now() / 86_400_000) + offset) % QUOTES.length;
  return QUOTES[idx];
}
