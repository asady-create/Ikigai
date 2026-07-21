/**
 * Shared domain types for Ikigai.
 * Extend these as Canvas, Goals, and Coach features grow.
 */

export type PromptTheme =
  | "clarity"
  | "skills"
  | "opportunities"
  | "risks"
  | "energy"
  | "ikigai"
  | "double-threat"
  | "action";

export interface ReflectionPrompt {
  id: string;
  theme: PromptTheme;
  title: string;
  prompt: string;
  /** Short nudge shown under the prompt — pushes toward action. */
  nudge?: string;
}

export interface ReflectionEntry {
  id: string;
  promptId: string;
  promptText: string;
  theme: PromptTheme;
  /** Markdown-supported journal body. */
  content: string;
  /** Energy level after reflecting (1–10). */
  energy: number;
  /** Clarity level after reflecting (1–10). */
  clarity: number;
  createdAt: string;
  updatedAt: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastReflectionDate: string | null;
  totalReflections: number;
}

export interface InsightResult {
  patterns: string[];
  opportunities: string[];
  actionSteps: string[];
  summary: string;
  generatedAt: string;
}

/** Goal types — ready for Goals Portfolio page. */
export type GoalCategory =
  | "career"
  | "skills"
  | "impact"
  | "energy"
  | "relationships"
  | "venture";

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  targetDate: string | null;
  progress: number;
  milestones: Milestone[];
  skillsAcquired: string[];
  opportunitiesPursued: string[];
  createdAt: string;
  updatedAt: string;
}

/** Purpose Canvas types — ready for Canvas page. */
export interface WheelOfLife {
  career: number;
  skills: number;
  impact: number;
  energy: number;
  relationships: number;
  creativity: number;
  adventure: number;
  wealth: number;
}

export interface IkigaiCanvas {
  love: string;
  goodAt: string;
  worldNeeds: string;
  paidFor: string;
}

export interface PurposeCanvas {
  wheel: WheelOfLife;
  ikigai: IkigaiCanvas;
  values: string[];
  visionStatement: string;
  updatedAt: string;
}

export interface AppData {
  reflections: ReflectionEntry[];
  goals: Goal[];
  canvas: PurposeCanvas | null;
  streak: StreakData;
  insights: InsightResult | null;
}
