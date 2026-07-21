/**
 * AI Coach / Insights placeholder.
 * Swap `analyzeReflections` with a real OpenAI or Claude API call later.
 * Keep the return shape stable so the UI doesn't need to change.
 */

import type { InsightResult, ReflectionEntry } from "./types";

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function topThemes(reflections: ReflectionEntry[], n = 3): string[] {
  const counts = new Map<string, number>();
  for (const r of reflections) {
    counts.set(r.theme, (counts.get(r.theme) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([theme, count]) => `${theme} (${count})`);
}

/**
 * Placeholder analyzer — rule-based insights in Andreessen's spirit.
 * TODO: Replace body with fetch('/api/analyze') → OpenAI/Claude.
 */
export async function analyzeReflections(
  reflections: ReflectionEntry[]
): Promise<InsightResult> {
  // Simulate network latency so the UI can show a loading state.
  await new Promise((r) => setTimeout(r, 900));

  if (!reflections.length) {
    return {
      summary:
        "No reflections yet. Clarity starts with writing. Pick today's prompt and ship one honest paragraph.",
      patterns: [
        "Empty journal = untested hypotheses about what you want.",
      ],
      opportunities: [
        "Start with the daily prompt. Don't overthink — write with maximum energy for 10 minutes.",
      ],
      actionSteps: [
        "Open Reflections and complete today's suggested prompt.",
        "Rate your energy and clarity honestly afterward.",
        "Come back tomorrow — streaks compound.",
      ],
      generatedAt: new Date().toISOString(),
    };
  }

  const energyAvg = avg(reflections.map((r) => r.energy));
  const clarityAvg = avg(reflections.map((r) => r.clarity));
  const themes = topThemes(reflections);
  const recent = reflections.slice(0, 5);
  const lowEnergy = reflections.filter((r) => r.energy <= 4).length;
  const highClarity = reflections.filter((r) => r.clarity >= 7).length;

  const patterns: string[] = [
    `You're reflecting most on: ${themes.join(", ") || "varied themes"}.`,
    `Average energy ${energyAvg.toFixed(1)}/10 · average clarity ${clarityAvg.toFixed(1)}/10 across ${reflections.length} entries.`,
  ];

  if (energyAvg < 5) {
    patterns.push(
      "Energy is running low. Half-measures reconfigure nothing — protect high-intensity blocks and cut drains."
    );
  } else if (energyAvg >= 7) {
    patterns.push(
      "Energy is high. This is the window to take asymmetric bets while drive is on your side."
    );
  }

  if (clarityAvg < 5) {
    patterns.push(
      "Clarity is foggy. Ambiguous goals don't reconfigure the world — get more specific about what you want."
    );
  } else if (highClarity > reflections.length / 2) {
    patterns.push(
      "Clarity is a strength right now. Convert it into shipped action before it decays into overthinking."
    );
  }

  if (lowEnergy > 0) {
    patterns.push(
      `${lowEnergy} reflection(s) logged low energy. Treat energy as a first-class portfolio metric.`
    );
  }

  const opportunities: string[] = [
    "Go closer to the center of the action in the theme you write about most.",
    "Identify one skill gap blocking your stated desires — become a double threat there.",
    "Turn your clearest reflection into a 30-day experiment with a measurable outcome.",
  ];

  if (recent.some((r) => r.theme === "opportunities" || r.theme === "action")) {
    opportunities.unshift(
      "You've already been thinking about opportunities and action — the next move is contact: message, pitch, ship."
    );
  }

  if (recent.some((r) => r.theme === "skills" || r.theme === "double-threat")) {
    opportunities.push(
      "Skill-stacking shows up in your journal. Pair deliberate practice with a public artifact this week."
    );
  }

  const actionSteps: string[] = [
    "Write one sentence: what you want, badly enough to rearrange your week for it.",
    "Take one calculated risk in the next 48 hours with asymmetric upside.",
    "Block 90 minutes for deliberate practice on your highest-leverage skill.",
    "Cut one low-energy commitment from your portfolio this week.",
  ];

  if (clarityAvg >= 6 && energyAvg >= 6) {
    actionSteps.unshift(
      "You're clear and energized — don't dilute it. Pick the boldest unfinished ask and send it today."
    );
  }

  const summary = [
    `Across ${reflections.length} reflections, your signal clusters around ${themes[0] ?? "finding direction"}.`,
    energyAvg >= 6
      ? "Energy is on your side — use it."
      : "Energy needs protecting before ambition can compound.",
    clarityAvg >= 6
      ? "Clarity is strong enough to act; journaling alone won't reconfigure anything."
      : "Tighten the ask: vague wants don't move the world.",
  ].join(" ");

  return {
    summary,
    patterns,
    opportunities,
    actionSteps,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Placeholder "Generate Next Action" — one concrete move.
 * TODO: Wire to LLM with user's latest reflections as context.
 */
export async function generateNextAction(
  reflections: ReflectionEntry[]
): Promise<string> {
  await new Promise((r) => setTimeout(r, 600));
  const latest = reflections[0];
  if (!latest) {
    return "Complete today's reflection prompt. Clarity is the prerequisite for bold action.";
  }
  if (latest.clarity >= 7 && latest.energy >= 6) {
    return `You're clear and charged. Convert "${latest.promptText.slice(0, 60)}…" into one outbound action in the next 2 hours — message, ship, or ask.`;
  }
  if (latest.energy < 5) {
    return "Energy first: eliminate one drain today, then take the smallest high-leverage action on your clearest goal.";
  }
  return "Tighten what you want into one sentence, then take one calculated risk that moves you toward the center of the action.";
}
