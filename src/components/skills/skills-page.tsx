"use client";

/**
 * Skills — Asset Portfolio / Development Roadmap.
 * Legacy have/lack UI: see `./skills-page-legacy.tsx` (kept for comparison).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { nanoid } from "nanoid";
import type { PurposeMap, Skill, SkillType } from "@/lib/types";
import { createEmptyMap, normalizeMap } from "@/lib/synthesis";
import {
  SKILL_TYPES,
  skillsByStatus,
  withDerivedStatus,
} from "@/lib/skills";
import { useIkigai } from "@/components/providers/ikigai-provider";
import { Button } from "@/components/ui/button";
import { Badge, Input, Label, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ViewTab = "portfolio" | "roadmap";

type SkillDraft = {
  name: string;
  type: SkillType;
  proficiency: number;
  demand: number;
  evidence: string;
  targetDirection: string;
};

const EMPTY_DRAFT: SkillDraft = {
  name: "",
  type: "skill",
  proficiency: 3,
  demand: 3,
  evidence: "",
  targetDirection: "",
};

function LevelBars({
  proficiency,
  demand,
}: {
  proficiency: number;
  demand: number;
}) {
  return (
    <div className="flex flex-col gap-1.5" aria-label={`Proficiency ${proficiency} of 5, demand ${demand} of 5`}>
      <div className="flex items-center gap-2">
        <span className="w-8 shrink-0 text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
          Prof
        </span>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={`p-${i}`}
              className={cn(
                "h-1.5 w-4 rounded-sm",
                i < proficiency
                  ? "bg-[var(--accent)]"
                  : "bg-[var(--surface-2)]"
              )}
            />
          ))}
        </div>
        <span className="text-[10px] tabular-nums text-[var(--muted)]">
          {proficiency}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-8 shrink-0 text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
          Need
        </span>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={`d-${i}`}
              className={cn(
                "h-1.5 w-4 rounded-sm",
                i < demand
                  ? "bg-[var(--foreground)]/70"
                  : "bg-[var(--surface-2)]"
              )}
            />
          ))}
        </div>
        <span className="text-[10px] tabular-nums text-[var(--muted)]">
          {demand}
        </span>
      </div>
    </div>
  );
}

function LevelSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );
}

function SkillItemCard({
  skill,
  onEdit,
  onRemove,
}: {
  skill: Skill;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const evidence = skill.evidence.trim();
  const long = evidence.length > 120;
  const shown =
    expanded || !long ? evidence : `${evidence.slice(0, 120).trim()}…`;

  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-semibold text-[var(--foreground)]">
              {skill.name || "Untitled"}
            </h3>
            <Badge className="capitalize">{skill.type}</Badge>
            {skill.status === "gap" && (
              <span className="rounded-md border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--accent)] uppercase">
                Gap
              </span>
            )}
            {skill.status === "developing" && (
              <span className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
                Developing
              </span>
            )}
          </div>
          {skill.targetDirection.trim() && (
            <p className="text-xs text-[var(--muted)]">
              Toward{" "}
              <span className="text-[var(--foreground)]">
                {skill.targetDirection}
              </span>
            </p>
          )}
          <LevelBars
            proficiency={skill.proficiency}
            demand={skill.demand}
          />
          {evidence ? (
            <div className="pt-1">
              <p className="text-sm leading-relaxed text-[var(--muted)]">
                {shown}
              </p>
              {long && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-1 text-xs font-medium text-[var(--accent)] hover:underline"
                >
                  {expanded ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          ) : (
            <p className="pt-1 text-xs text-[var(--muted)]/70">No evidence yet</p>
          )}
        </div>
        <div className="flex shrink-0 gap-0.5">
          <button
            type="button"
            onClick={onEdit}
            className="rounded p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
            aria-label={`Edit ${skill.name}`}
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1.5 text-[var(--muted)] transition hover:text-red-600"
            aria-label={`Remove ${skill.name}`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

function SkillFormModal({
  open,
  mode,
  draft,
  setDraft,
  error,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: "add" | "edit";
  draft: SkillDraft;
  setDraft: (d: SkillDraft) => void;
  error: string | null;
  onClose: () => void;
  onSave: () => void;
}) {
  if (!open) return null;

  const preview = withDerivedStatus({
    id: "preview",
    ...draft,
    lastReviewed: new Date().toISOString(),
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--foreground)]/30 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="skill-form-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-lg"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              id="skill-form-title"
              className="font-display text-lg font-semibold text-[var(--foreground)]"
            >
              {mode === "add" ? "Add item" : "Edit item"}
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Status updates from proficiency × demand:{" "}
              <span className="font-medium capitalize text-[var(--foreground)]">
                {preview.status}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-[var(--muted)] hover:bg-[var(--surface-2)]"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="skill-name">Name</Label>
            <Input
              id="skill-name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="e.g. Product storytelling"
              maxLength={80}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="skill-direction">
              Target direction <span className="text-[var(--accent)]">*</span>
            </Label>
            <Input
              id="skill-direction"
              value={draft.targetDirection}
              onChange={(e) =>
                setDraft({ ...draft, targetDirection: e.target.value })
              }
              placeholder="Goal or role this is evaluated against"
              maxLength={120}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="skill-type">Type</Label>
            <select
              id="skill-type"
              value={draft.type}
              onChange={(e) =>
                setDraft({ ...draft, type: e.target.value as SkillType })
              }
              className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm capitalize text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30"
            >
              {SKILL_TYPES.map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <LevelSelect
              id="skill-prof"
              label="Proficiency (1–5)"
              value={draft.proficiency}
              onChange={(n) => setDraft({ ...draft, proficiency: n })}
            />
            <LevelSelect
              id="skill-demand"
              label="Demand (1–5)"
              value={draft.demand}
              onChange={(n) => setDraft({ ...draft, demand: n })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="skill-evidence">Evidence</Label>
            <Textarea
              id="skill-evidence"
              value={draft.evidence}
              onChange={(e) =>
                setDraft({ ...draft, evidence: e.target.value })
              }
              placeholder="Project, result, or artifact that proves this"
              rows={3}
              className="min-h-[88px]"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === "add" ? "Add" : "Save"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function SkillsPage() {
  const { ready, data, upsertMap } = useIkigai();
  const [map, setMap] = useState<PurposeMap>(createEmptyMap);
  const [tab, setTab] = useState<ViewTab>("portfolio");
  const [savedFlash, setSavedFlash] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SkillDraft>(EMPTY_DRAFT);
  const [formError, setFormError] = useState<string | null>(null);
  const hydrated = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!ready || hydrated.current) return;
    setMap(normalizeMap(data.map));
    hydrated.current = true;
  }, [ready, data.map]);

  const persist = useCallback(
    (next: PurposeMap) => {
      if (!hydrated.current) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        upsertMap({ ...next, updatedAt: new Date().toISOString() });
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1000);
      }, 300);
    },
    [upsertMap]
  );

  const setSkills = (skills: Skill[]) => {
    setMap((prev) => {
      const next = { ...prev, skills };
      persist(next);
      return next;
    });
  };

  const assets = useMemo(
    () => skillsByStatus(map.skills ?? [], "asset"),
    [map.skills]
  );
  const gaps = useMemo(
    () => skillsByStatus(map.skills ?? [], "gap"),
    [map.skills]
  );
  const developing = useMemo(
    () => skillsByStatus(map.skills ?? [], "developing"),
    [map.skills]
  );

  const openAdd = () => {
    setEditingId(null);
    setDraft({
      ...EMPTY_DRAFT,
      targetDirection: map.want.trim() || map.offer.trim() || "",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (skill: Skill) => {
    setEditingId(skill.id);
    setDraft({
      name: skill.name,
      type: skill.type,
      proficiency: skill.proficiency,
      demand: skill.demand,
      evidence: skill.evidence,
      targetDirection: skill.targetDirection,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormError(null);
  };

  const saveDraft = () => {
    const name = draft.name.trim();
    const targetDirection = draft.targetDirection.trim();
    if (!name) {
      setFormError("Name is required.");
      return;
    }
    if (!targetDirection) {
      setFormError("Target direction is required.");
      return;
    }
    const now = new Date().toISOString();
    if (editingId) {
      setSkills(
        (map.skills ?? []).map((s) =>
          s.id === editingId
            ? withDerivedStatus({
                ...s,
                name,
                type: draft.type,
                proficiency: draft.proficiency,
                demand: draft.demand,
                evidence: draft.evidence.trim(),
                targetDirection,
                lastReviewed: now,
              })
            : s
        )
      );
    } else {
      const next = withDerivedStatus({
        id: nanoid(8),
        name,
        type: draft.type,
        proficiency: draft.proficiency,
        demand: draft.demand,
        evidence: draft.evidence.trim(),
        targetDirection,
        lastReviewed: now,
      });
      setSkills([...(map.skills ?? []), next]);
    }
    closeModal();
  };

  const removeSkill = (id: string) => {
    setSkills((map.skills ?? []).filter((s) => s.id !== id));
  };

  if (!ready) {
    return (
      <div className="animate-pulse space-y-4 py-8">
        <div className="h-8 w-40 rounded bg-[var(--surface-2)]" />
        <div className="h-10 w-72 rounded bg-[var(--surface-2)]" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-36 rounded-xl bg-[var(--surface-2)]" />
          <div className="h-36 rounded-xl bg-[var(--surface-2)]" />
        </div>
      </div>
    );
  }

  const list =
    tab === "portfolio"
      ? assets
      : [...gaps, ...developing];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
            Skills
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Portfolio &amp; roadmap
          </h1>
          <p className="mt-2 max-w-lg text-sm text-[var(--muted)]">
            Status is computed from proficiency × demand relative to a target
            direction — assets you can lean on, and gaps still to close.
          </p>
        </div>
        <div className="flex items-center gap-3">
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
          <Button type="button" onClick={openAdd}>
            <Plus />
            Add item
          </Button>
        </div>
      </header>

      <div
        className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1"
        role="tablist"
        aria-label="Skills view"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "portfolio"}
          onClick={() => setTab("portfolio")}
          className={cn(
            "rounded-md px-3.5 py-1.5 text-sm font-medium transition",
            tab === "portfolio"
              ? "bg-[var(--accent-soft)] text-[var(--accent)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          )}
        >
          Asset Portfolio
          <span className="ml-1.5 tabular-nums text-xs opacity-70">
            {assets.length}
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "roadmap"}
          onClick={() => setTab("roadmap")}
          className={cn(
            "rounded-md px-3.5 py-1.5 text-sm font-medium transition",
            tab === "roadmap"
              ? "bg-[var(--accent-soft)] text-[var(--accent)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          )}
        >
          Development Roadmap
          <span className="ml-1.5 tabular-nums text-xs opacity-70">
            {gaps.length + developing.length}
          </span>
        </button>
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-3"
      >
        {tab === "portfolio" && (
          <p className="text-sm text-[var(--muted)]">
            High proficiency (≥4) where demand is real (≥3), sorted by demand.
          </p>
        )}
        {tab === "roadmap" && (
          <p className="text-sm text-[var(--muted)]">
            Gaps first (low proficiency, high demand), then developing items —
            both sorted by demand.
          </p>
        )}

        {list.length === 0 ? (
          <p className="py-8 text-sm text-[var(--muted)]">
            {tab === "portfolio"
              ? "No assets yet. Raise proficiency on high-demand items, or add one you already own."
              : "No gaps or developing items yet."}
          </p>
        ) : tab === "roadmap" ? (
          <div className="space-y-8">
            {gaps.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-display text-sm font-semibold tracking-[0.12em] text-[var(--muted)] uppercase">
                  Gaps
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {gaps.map((skill) => (
                    <SkillItemCard
                      key={skill.id}
                      skill={skill}
                      onEdit={() => openEdit(skill)}
                      onRemove={() => removeSkill(skill.id)}
                    />
                  ))}
                </div>
              </section>
            )}
            {developing.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-display text-sm font-semibold tracking-[0.12em] text-[var(--muted)] uppercase">
                  Developing
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {developing.map((skill) => (
                    <SkillItemCard
                      key={skill.id}
                      skill={skill}
                      onEdit={() => openEdit(skill)}
                      onRemove={() => removeSkill(skill.id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <AnimatePresence initial={false}>
              {assets.map((skill) => (
                <SkillItemCard
                  key={skill.id}
                  skill={skill}
                  onEdit={() => openEdit(skill)}
                  onRemove={() => removeSkill(skill.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      <SkillFormModal
        open={modalOpen}
        mode={editingId ? "edit" : "add"}
        draft={draft}
        setDraft={setDraft}
        error={formError}
        onClose={closeModal}
        onSave={saveDraft}
      />
    </div>
  );
}
