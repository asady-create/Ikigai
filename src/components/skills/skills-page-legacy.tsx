/**
 * LEGACY — pre–asset-portfolio Skills UI (have / lack two-column).
 * Kept for comparison while verifying the new SkillsPage.
 * Not imported by the live route. Delete after you confirm the new model.
 */

"use client";

import { useState } from "react";
import { AnimatePresence, Reorder, motion, useDragControls } from "framer-motion";
import {
  ArrowRightLeft,
  ChevronDown,
  GripVertical,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Old flat skill shape used by the have/lack UI. */
export type LegacyHaveLackSkill = {
  id: string;
  name: string;
  note: string;
};

/** @deprecated Renamed from SkillCard — have/lack card. */
export function LegacyHaveLackSkillCard({
  skill,
  accent,
  noteOpen,
  onToggleNote,
  onRemove,
  onRename,
  onNote,
  onMove,
  moveLabel,
}: {
  skill: LegacyHaveLackSkill;
  accent: "have" | "lack";
  noteOpen: boolean;
  onToggleNote: () => void;
  onRemove: () => void;
  onRename: (name: string) => void;
  onNote: (note: string) => void;
  onMove: () => void;
  moveLabel: string;
}) {
  const controls = useDragControls();
  const hasNote = Boolean(skill.note.trim());

  return (
    <Reorder.Item
      value={skill}
      id={skill.id}
      dragListener={false}
      dragControls={controls}
      className={cn(
        "list-none rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3",
        accent === "lack" && "border-l-2 border-l-[var(--accent)]"
      )}
      whileDrag={{
        scale: 1.02,
        boxShadow: "0 8px 24px rgba(18, 20, 26, 0.12)",
        zIndex: 20,
      }}
    >
      <div className="flex items-start gap-1.5">
        <button
          type="button"
          className="mt-6 shrink-0 cursor-grab touch-none rounded p-1 text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] active:cursor-grabbing"
          aria-label="Drag to reorder"
          onPointerDown={(e) => controls.start(e)}
        >
          <GripVertical className="size-4" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[10px] font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
            Skill
          </p>
          <Input
            value={skill.name}
            onChange={(e) => onRename(e.target.value)}
            aria-label="Skill name"
            placeholder="Skill name"
            className="h-9 border-[var(--border)] bg-[var(--background)] font-medium"
          />
        </div>

        <div className="mt-5 flex shrink-0 gap-0.5">
          <button
            type="button"
            onClick={onToggleNote}
            className={cn(
              "rounded p-1.5 transition",
              noteOpen || hasNote
                ? "text-[var(--accent)] hover:bg-[var(--accent-soft)]"
                : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
            )}
            aria-label={noteOpen ? "Hide note" : "Show note"}
            aria-expanded={noteOpen}
            title={noteOpen ? "Hide note" : "Show note"}
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                noteOpen && "rotate-180"
              )}
            />
          </button>
          <button
            type="button"
            onClick={onMove}
            className="rounded p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
            aria-label={moveLabel}
            title={moveLabel}
          >
            <ArrowRightLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1.5 text-[var(--muted)] transition hover:text-red-600"
            aria-label={`Remove ${skill.name || "skill"}`}
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {noteOpen && (
          <motion.div
            key="note"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mt-2.5 ml-7 border-l-2 border-[var(--border)] pl-3">
              <Textarea
                id={`skill-note-${skill.id}`}
                value={skill.note}
                onChange={(e) => onNote(e.target.value)}
                aria-label={`Note for ${skill.name || "skill"}`}
                placeholder="Level, proof, why it matters…"
                rows={2}
                className="min-h-[64px] resize-y border-[var(--border)] bg-[var(--background)]/70 px-2.5 py-2 text-xs leading-relaxed text-[var(--muted)] placeholder:text-[var(--muted)]/50 focus:text-[var(--foreground)]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}

/** @deprecated Renamed from SkillColumn — have/lack column. */
export function LegacyHaveLackSkillColumn({
  title,
  subtitle,
  skills,
  draft,
  setDraft,
  onAdd,
  onRemove,
  onRename,
  onNote,
  onMove,
  onReorder,
  moveLabel,
  accent,
}: {
  title: string;
  subtitle: string;
  skills: LegacyHaveLackSkill[];
  draft: string;
  setDraft: (v: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onNote: (id: string, note: string) => void;
  onMove: (id: string) => void;
  onReorder: (next: LegacyHaveLackSkill[]) => void;
  moveLabel: string;
  accent: "have" | "lack";
}) {
  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({});

  const toggleNote = (id: string) => {
    setOpenNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isNoteOpen = (skill: LegacyHaveLackSkill) => {
    if (openNotes[skill.id] !== undefined) return openNotes[skill.id];
    return Boolean(skill.note.trim());
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-[var(--foreground)]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
      </div>

      {skills.length === 0 ? (
        <p className="py-2 text-sm text-[var(--muted)]">None yet.</p>
      ) : (
        <Reorder.Group
          axis="y"
          values={skills}
          onReorder={onReorder}
          className="flex flex-col gap-3"
        >
          {skills.map((skill) => (
            <LegacyHaveLackSkillCard
              key={skill.id}
              skill={skill}
              accent={accent}
              noteOpen={isNoteOpen(skill)}
              onToggleNote={() => toggleNote(skill.id)}
              onRemove={() => onRemove(skill.id)}
              onRename={(name) => onRename(skill.id, name)}
              onNote={(note) => onNote(skill.id, note)}
              onMove={() => onMove(skill.id)}
              moveLabel={moveLabel}
            />
          ))}
        </Reorder.Group>
      )}

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
