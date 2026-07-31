import { DEFAULT_NOTE_TAGS } from "./types";

const LEGACY_HASHTAG_ALIASES: Record<string, string> = {
  want: "Want",
  offer: "Offer",
  need: "Need",
  reward: "Reward",
  have: "Have",
  gap: "Gap",
  gaps: "Gap",
  lack: "Gap",
  idea: "Idea",
  ideas: "Idea",
  value: "Value",
  values: "Value",
};

const KEYWORD_RULES: { tag: string; pattern: RegExp }[] = [
  { tag: "Want", pattern: /\b(i want|what i want|goal|purpose|desire)\b/i },
  { tag: "Offer", pattern: /\b(deliver|build|product|service|offer)\b/i },
  { tag: "Need", pattern: /\b(need|users?|customers?|market|audience)\b/i },
  { tag: "Reward", pattern: /\b(paid|pay|money|revenue|equity|reward)\b/i },
  { tag: "Have", pattern: /\b(i (already )?have|skilled at|good at)\b/i },
  { tag: "Gap", pattern: /\b(lack|gap|need to learn|missing skill)\b/i },
  { tag: "Idea", pattern: /\b(idea|hypothesis|what if|maybe)\b/i },
  { tag: "Value", pattern: /\b(value|principle|non-negotiable|integrity)\b/i },
];

/** Normalize a raw tag label into a short display form. */
export function normalizeTagLabel(raw: string): string {
  return raw
    .replace(/^#/, "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 32);
}

export function normalizeNoteTags(
  raw: string[] | undefined | null
): string[] {
  if (!raw || raw.length === 0) {
    return [...DEFAULT_NOTE_TAGS];
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const label = normalizeTagLabel(String(item ?? ""));
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out.length > 0 ? out : [...DEFAULT_NOTE_TAGS];
}

export function normalizeNoteTagList(
  raw: unknown,
  vocabulary: string[]
): string[] {
  if (!Array.isArray(raw)) return [];
  const vocabByKey = new Map(
    vocabulary.map((t) => [t.toLowerCase(), t] as const)
  );
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const label = normalizeTagLabel(String(item ?? ""));
    if (!label) continue;
    const key = label.toLowerCase();
    const canonical = vocabByKey.get(key) ?? label;
    const canonKey = canonical.toLowerCase();
    if (seen.has(canonKey)) continue;
    seen.add(canonKey);
    out.push(canonical);
  }
  return out;
}

/** Parse #Tag-style hashtags from note body against the vocabulary. */
export function tagsFromHashtags(
  content: string,
  vocabulary: string[] = [...DEFAULT_NOTE_TAGS]
): string[] {
  const vocabByKey = new Map(
    vocabulary.map((t) => [t.toLowerCase(), t] as const)
  );
  const found = new Set<string>();
  const re = /#([A-Za-z][\w-]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const key = m[1].toLowerCase();
    const alias = LEGACY_HASHTAG_ALIASES[key];
    const tag =
      vocabByKey.get(key) ??
      (alias && vocabByKey.get(alias.toLowerCase())) ??
      null;
    if (tag) found.add(tag);
  }
  return vocabulary.filter((t) => found.has(t));
}

/** Lightweight keyword auto-tag when no hashtags present. */
export function tagsFromKeywords(
  content: string,
  vocabulary: string[] = [...DEFAULT_NOTE_TAGS]
): string[] {
  const vocab = new Set(vocabulary.map((t) => t.toLowerCase()));
  const found = new Set<string>();
  for (const rule of KEYWORD_RULES) {
    if (!vocab.has(rule.tag.toLowerCase())) continue;
    if (rule.pattern.test(content)) {
      const match = vocabulary.find(
        (t) => t.toLowerCase() === rule.tag.toLowerCase()
      );
      if (match) found.add(match);
    }
  }
  return vocabulary.filter((t) => found.has(t));
}

/**
 * Suggest tags: prefer explicit hashtags; else keywords.
 * Merges with any manually selected tags.
 */
export function suggestTags(
  content: string,
  manual: string[] = [],
  vocabulary: string[] = [...DEFAULT_NOTE_TAGS]
): string[] {
  const fromHash = tagsFromHashtags(content, vocabulary);
  const auto = fromHash.length > 0 ? fromHash : tagsFromKeywords(content, vocabulary);
  const set = new Set<string>(
    [...manual, ...auto].map((t) => t.toLowerCase())
  );
  return vocabulary.filter((t) => set.has(t.toLowerCase()));
}

export function isKnownTag(
  value: string,
  vocabulary: string[] = [...DEFAULT_NOTE_TAGS]
): boolean {
  const key = normalizeTagLabel(value).toLowerCase();
  return vocabulary.some((t) => t.toLowerCase() === key);
}

/** @deprecated use isKnownTag */
export function isNoteTag(value: string): boolean {
  return isKnownTag(value);
}
