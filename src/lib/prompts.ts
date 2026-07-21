import type { ReflectionPrompt } from "./types";

/**
 * Curated reflection prompts — open-ended, Andreessen-spirited.
 * Grouped by theme for the Reflections library.
 */
export const PROMPTS: ReflectionPrompt[] = [
  // ── Clarity ──────────────────────────────────────────────
  {
    id: "clarity-1",
    theme: "clarity",
    title: "What do you actually want?",
    prompt:
      "Strip away what you *should* want. What do you want badly enough that you'd rearrange your life for it? Be specific. Vague desires reconfigure nothing.",
    nudge: "Write it like a declaration, not a wish.",
  },
  {
    id: "clarity-2",
    theme: "clarity",
    title: "The unfiltered north star",
    prompt:
      "If failure were impossible and social judgment irrelevant, what would you build, join, or become in the next 3 years?",
    nudge: "Clarity compounds. Ambiguity drains.",
  },
  {
    id: "clarity-3",
    theme: "clarity",
    title: "Where are you lying to yourself?",
    prompt:
      "Name one story you tell about your career or purpose that feels safe but isn't true. What would change if you dropped it?",
  },
  {
    id: "clarity-4",
    theme: "clarity",
    title: "Signal vs. noise",
    prompt:
      "List the last five things that consumed your attention. Which ones moved you toward agency and skill? Which were comfortable distractions?",
  },

  // ── Skills ───────────────────────────────────────────────
  {
    id: "skills-1",
    theme: "skills",
    title: "Become a double threat",
    prompt:
      "What two skills, combined, would make you unusually hard to ignore in your field? What's your plan to level both in the next 90 days?",
    nudge: "Stack rare skills. The market notices.",
  },
  {
    id: "skills-2",
    theme: "skills",
    title: "The skill gap that blocks you",
    prompt:
      "What skill, if you had it at a high level tomorrow, would unlock the opportunity you're circling? How will you acquire it — deliberately, not eventually?",
  },
  {
    id: "skills-3",
    theme: "skills",
    title: "Triple-threat audition",
    prompt:
      "Beyond your primary craft, what adjacent capabilities (communication, taste, systems thinking, distribution, capital allocation) are you underinvesting in?",
  },
  {
    id: "skills-4",
    theme: "skills",
    title: "Deliberate practice audit",
    prompt:
      "Where do you practice at the edge of your ability vs. coasting on what you already know? Redesign one weekly block for real growth.",
  },

  // ── Opportunities ────────────────────────────────────────
  {
    id: "opp-1",
    theme: "opportunities",
    title: "Center of the action",
    prompt:
      "Where is the center of the action in your domain right now — the people, places, companies, or scenes with disproportionate opportunity? How close are you?",
    nudge: "Proximity to action is a strategy.",
  },
  {
    id: "opp-2",
    theme: "opportunities",
    title: "The opportunity you're avoiding",
    prompt:
      "What opportunity keeps appearing that you keep postponing? What's the real cost of waiting another six months?",
  },
  {
    id: "opp-3",
    theme: "opportunities",
    title: "Create vs. wait",
    prompt:
      "Describe one opportunity you could *create* this month by combining your skills with someone else's distribution, capital, or audience.",
  },
  {
    id: "opp-4",
    theme: "opportunities",
    title: "Portfolio of bets",
    prompt:
      "If your career were a venture portfolio, which current bets have asymmetric upside? Which are low-energy holdings you should cut?",
  },

  // ── Risks ────────────────────────────────────────────────
  {
    id: "risk-1",
    theme: "risks",
    title: "Calculated risk inventory",
    prompt:
      "What's a calculated risk you've been avoiding that has asymmetric upside? What's the worst realistic downside — and can you survive it?",
    nudge: "Risk is the cost of admission.",
  },
  {
    id: "risk-2",
    theme: "risks",
    title: "The risk of not risking",
    prompt:
      "What does your life look like in five years if you keep optimizing for safety? Be honest. Is that a life you'd fight for?",
  },
  {
    id: "risk-3",
    theme: "risks",
    title: "Reputation risk vs. regret risk",
    prompt:
      "Which are you more afraid of — looking foolish, or looking back with regret? How does that fear currently shape your choices?",
  },

  // ── Energy ───────────────────────────────────────────────
  {
    id: "energy-1",
    theme: "energy",
    title: "Maximum energy audit",
    prompt:
      "When do you operate at maximum energy, drive, and passion? What environments, people, and work create that state — and what systematically drains it?",
    nudge: "Half-measures reconfigure nothing.",
  },
  {
    id: "energy-2",
    theme: "energy",
    title: "Protect the flame",
    prompt:
      "List three energy vampires in your week. For each, decide: eliminate, renegotiate, or redesign how you engage.",
  },
  {
    id: "energy-3",
    theme: "energy",
    title: "Intensity without burnout",
    prompt:
      "How do you sustain high intensity without self-destruction? What recovery practices actually work for you — not what you think should work?",
  },

  // ── Ikigai-style ─────────────────────────────────────────
  {
    id: "ikigai-1",
    theme: "ikigai",
    title: "What you love",
    prompt:
      "What activities make you lose track of time and want to go deeper — not just enjoy casually? Where does obsession live?",
  },
  {
    id: "ikigai-2",
    theme: "ikigai",
    title: "What you're good at",
    prompt:
      "What do others consistently ask you for help with? What do you do better than most people around you — even if you take it for granted?",
  },
  {
    id: "ikigai-3",
    theme: "ikigai",
    title: "What the world needs",
    prompt:
      "What problem in the world (or your industry) feels urgent and underserved? Where could your skills create disproportionate impact?",
  },
  {
    id: "ikigai-4",
    theme: "ikigai",
    title: "What you can be paid for",
    prompt:
      "Where does the market already pay for work adjacent to what you love and are good at? How could you move closer to that intersection?",
  },
  {
    id: "ikigai-5",
    theme: "ikigai",
    title: "The intersection",
    prompt:
      "Synthesize: love × good at × world needs × paid for. Write a one-paragraph purpose hypothesis you can test in the next 30 days.",
    nudge: "Purpose is a hypothesis. Test it.",
  },

  // ── Double Threat ────────────────────────────────────────
  {
    id: "double-1",
    theme: "double-threat",
    title: "Your unfair combination",
    prompt:
      "Name the rare combination of skills, experiences, or perspectives that only *you* currently hold. How are you underusing it?",
  },
  {
    id: "double-2",
    theme: "double-threat",
    title: "Adjacent domain invasion",
    prompt:
      "What domain adjacent to yours would become 10x more interesting if you brought your primary skill into it?",
  },
  {
    id: "double-3",
    theme: "double-threat",
    title: "The missing edge",
    prompt:
      "If you were interviewing yourself for a role that doesn't exist yet, what skill would make you the only credible candidate?",
  },

  // ── Action ───────────────────────────────────────────────
  {
    id: "action-1",
    theme: "action",
    title: "One bold move",
    prompt:
      "What's one bold move you could take this week that your future self would thank you for — a message sent, a project started, a door knocked on?",
    nudge: "Clarity without action is just journaling.",
  },
  {
    id: "action-2",
    theme: "action",
    title: "Ship something",
    prompt:
      "What have you been polishing instead of shipping? Define the minimum version you can put into the world in 7 days.",
  },
  {
    id: "action-3",
    theme: "action",
    title: "Ask for the thing",
    prompt:
      "Who could open a door for you this month? Draft the ask — clear, specific, no apology. Then send it.",
  },
  {
    id: "action-4",
    theme: "action",
    title: "Reconfigure the week",
    prompt:
      "If the world is malleable, redesign next week around your highest-leverage work. What gets cut? What gets protected time?",
  },
];

export const THEME_LABELS: Record<ReflectionPrompt["theme"], string> = {
  clarity: "Clarity",
  skills: "Skills",
  opportunities: "Opportunities",
  risks: "Risks",
  energy: "Energy",
  ikigai: "Ikigai",
  "double-threat": "Double Threat",
  action: "Action",
};

export const THEME_ORDER: ReflectionPrompt["theme"][] = [
  "clarity",
  "skills",
  "opportunities",
  "risks",
  "energy",
  "ikigai",
  "double-threat",
  "action",
];

export function getPromptsByTheme(theme: ReflectionPrompt["theme"]) {
  return PROMPTS.filter((p) => p.theme === theme);
}

export function getPromptById(id: string) {
  return PROMPTS.find((p) => p.id === id);
}

/** Daily suggested prompt — deterministic by day of year. */
export function getDailyPrompt(): ReflectionPrompt {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const day = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  return PROMPTS[day % PROMPTS.length];
}

export function getRandomPrompt(excludeId?: string): ReflectionPrompt {
  const pool = excludeId ? PROMPTS.filter((p) => p.id !== excludeId) : PROMPTS;
  return pool[Math.floor(Math.random() * pool.length)];
}
