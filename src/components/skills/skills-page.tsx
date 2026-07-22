"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Plus, X } from "lucide-react";
import { nanoid } from "nanoid";
import type { PurposeMap, Skill } from "@/lib/types";
import { createEmptyMap } from "@/lib/synthesis";
import { useIkigai } from "@/components/providers/ikigai-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function SkillColumn({
  title,
  subtitle,
  skills,
  draft,
  setDraft,
  onAdd,
  onRemove,
  onNote,
  accent,
}: {
  title: string;
  subtitle: string;
  skills: Skill[];
  draft: string;
  setDraft: (v: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onNote: (id: string, note: string) => void;
  accent: "have" | "lack";
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-[var(--foreground)]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
      </div>

      <ul className="space-y-2">
        {skills.length === 0 && (
          <li className="py-2 text-sm text-[var(--muted)]">None yet.</li>
        )}
        {skills.map((skill) => (
          <li
            key={skill.id}
            className={cn(
              "rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3",
              accent === "lack" && "border-l-2 border-l-[var(--accent)]"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-[var(--foreground)]">{skill.name}</p>
              <button
                type="button"
                onClick={() => onRemove(skill.id)}
                className="rounded p-0.5 text-[var(--muted)] transition hover:text-red-600"
                aria-label={`Remove ${skill.name}`}
              >
                <X className="size-4" />
              </button>
            </div>
            <Input
              value={skill.note}
              onChange={(e) => onNote(skill.id, e.target.value)}
              placeholder="Optional note"
              className="mt-2 h-8 border-transparent bg-transparent px-0 text-xs shadow-none focus-visible:ring-0"
            />
          </li>
        ))}
      </ul>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onAdd();
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a skill"
          maxLength={80}
        />
        <Button type="submit" variant="secondary" disabled={!draft.trim()}>
          <Plus />
          Add
        </Button>
      </form>
    </section>
  );
}

export function SkillsPage() {
  const { ready, data, upsertMap } = useIkigai();
  const [map, setMap] = useState<PurposeMap>(createEmptyMap);
  const [haveDraft, setHaveDraft] = useState("");
  const [lackDraft, setLackDraft] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const hydrated = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!ready || hydrated.current) return;
    setMap(data.map ?? createEmptyMap());
    hydrated.current = true;
  }, [ready, data.map]);

  const persist = useCallback(
    (next: PurposeMap) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        upsertMap({ ...next, updatedAt: new Date().toISOString() });
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1000);
      }, 300);
    },
    [upsertMap]
  );

  const updateSkills = (
    list: "skillsHave" | "skillsLack",
    nextSkills: Skill[]
  ) => {
    setMap((prev) => {
      const next = { ...prev, [list]: nextSkills };
      persist(next);
      return next;
    });
  };

  const addSkill = (list: "skillsHave" | "skillsLack", name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const existing = map[list];
    if (existing.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }
    updateSkills(list, [
      ...existing,
      { id: nanoid(8), name: trimmed, note: "" },
    ]);
  };

  if (!ready) {
    return (
      <div className="animate-pulse space-y-4 py-8">
        <div className="h-8 w-32 rounded bg-[var(--surface-2)]" />
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="h-48 rounded-xl bg-[var(--surface-2)]" />
          <div className="h-48 rounded-xl bg-[var(--surface-2)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
            Skills
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Have vs lack
          </h1>
          <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
            List what you already bring — and what still blocks the purpose you
            wrote on the Map.
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-xs transition-opacity",
            savedFlash
              ? "text-[var(--accent)] opacity-100"
              : "text-[var(--muted)] opacity-40"
          )}
        >
          <Check className="size-3.5" />
          Saved
        </span>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-10 sm:grid-cols-2"
      >
        <SkillColumn
          title="I have"
          subtitle="Skills you can already use."
          skills={map.skillsHave}
          draft={haveDraft}
          setDraft={setHaveDraft}
          accent="have"
          onAdd={() => {
            addSkill("skillsHave", haveDraft);
            setHaveDraft("");
          }}
          onRemove={(id) =>
            updateSkills(
              "skillsHave",
              map.skillsHave.filter((s) => s.id !== id)
            )
          }
          onNote={(id, note) =>
            updateSkills(
              "skillsHave",
              map.skillsHave.map((s) => (s.id === id ? { ...s, note } : s))
            )
          }
        />
        <SkillColumn
          title="I lack"
          subtitle="Skills required for what you want."
          skills={map.skillsLack}
          draft={lackDraft}
          setDraft={setLackDraft}
          accent="lack"
          onAdd={() => {
            addSkill("skillsLack", lackDraft);
            setLackDraft("");
          }}
          onRemove={(id) =>
            updateSkills(
              "skillsLack",
              map.skillsLack.filter((s) => s.id !== id)
            )
          }
          onNote={(id, note) =>
            updateSkills(
              "skillsLack",
              map.skillsLack.map((s) => (s.id === id ? { ...s, note } : s))
            )
          }
        />
      </motion.div>
    </div>
  );
}
