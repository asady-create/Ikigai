"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { nanoid } from "nanoid";
import { Check, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useIkigai } from "@/components/providers/ikigai-provider";
import type { Note } from "@/lib/types";
import {
  normalizeTagLabel,
  suggestTags,
  tagsFromHashtags,
} from "@/lib/note-tags";
import { formatDisplayDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DateFilter = "all" | "today" | "7d" | "30d";

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

function inDateFilter(iso: string, filter: DateFilter): boolean {
  if (filter === "all") return true;
  const created = new Date(iso);
  const now = new Date();
  if (filter === "today") {
    return dateKey(iso) === dateKey(now.toISOString());
  }
  const days = filter === "7d" ? 7 : 30;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return created >= cutoff;
}

function TagChip({
  tag,
  active,
  onClick,
  onRemove,
}: {
  tag: string;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition",
        active
          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
          : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]"
      )}
    >
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "hover:text-[var(--foreground)]",
            active && "text-[var(--accent)]"
          )}
        >
          #{tag}
        </button>
      ) : (
        <span>#{tag}</span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-0.5 text-current/70 hover:bg-black/5 hover:text-red-600"
          aria-label={`Remove #${tag}`}
          title="Remove tag"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}

export function NotesPage() {
  const {
    ready,
    notes,
    noteTags,
    upsertNote,
    removeNote,
    setNoteTags,
  } = useIkigai();

  const [draft, setDraft] = useState("");
  const [manualTags, setManualTags] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | "all">("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  // Vocabulary manager
  const [showTags, setShowTags] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [editTagFrom, setEditTagFrom] = useState<string | null>(null);
  const [editTagValue, setEditTagValue] = useState("");

  // Per-note editor
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editAddTag, setEditAddTag] = useState("");

  useEffect(() => {
    if (tagFilter !== "all" && !noteTags.includes(tagFilter)) {
      setTagFilter("all");
    }
  }, [noteTags, tagFilter]);

  const previewTags = useMemo(
    () => suggestTags(draft, manualTags, noteTags),
    [draft, manualTags, noteTags]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((note) => {
      if (tagFilter !== "all" && !note.tags.includes(tagFilter)) return false;
      if (!inDateFilter(note.createdAt, dateFilter)) return false;
      if (!q) return true;
      const hay =
        `${note.content} ${note.tags.map((t) => `#${t}`).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [notes, query, tagFilter, dateFilter]);

  const toggleManualTag = (tag: string) => {
    setManualTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const save = () => {
    const content = draft.trim();
    if (!content) return;
    const now = new Date().toISOString();
    const tags = suggestTags(content, manualTags, noteTags);
    upsertNote({
      id: nanoid(10),
      content,
      tags,
      createdAt: now,
      updatedAt: now,
    });
    setDraft("");
    setManualTags([]);
  };

  const startEditNote = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
    setEditTags([...note.tags]);
    setEditAddTag("");
  };

  const cancelEditNote = () => {
    setEditingId(null);
    setEditContent("");
    setEditTags([]);
    setEditAddTag("");
  };

  const saveEditNote = (note: Note) => {
    const content = editContent.trim();
    if (!content) return;
    upsertNote({
      ...note,
      content,
      tags: editTags,
      updatedAt: new Date().toISOString(),
    });
    cancelEditNote();
  };

  const toggleEditTag = (tag: string) => {
    setEditTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addEditTag = () => {
    const label = normalizeTagLabel(editAddTag);
    if (!label) return;
    const existing = noteTags.find(
      (t) => t.toLowerCase() === label.toLowerCase()
    );
    const tag = existing ?? label;
    if (!noteTags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setNoteTags([...noteTags, tag]);
    }
    setEditTags((prev) =>
      prev.some((t) => t.toLowerCase() === tag.toLowerCase())
        ? prev
        : [...prev, tag]
    );
    setEditAddTag("");
  };

  const onDraftChange = (value: string) => {
    setDraft(value);
    const fromHash = tagsFromHashtags(value, noteTags);
    if (fromHash.length > 0) {
      setManualTags((prev) => {
        const set = new Set(
          [...prev, ...fromHash].map((t) => t.toLowerCase())
        );
        return noteTags.filter((t) => set.has(t.toLowerCase()));
      });
    }
  };

  const addVocabularyTag = () => {
    const label = normalizeTagLabel(newTag);
    if (!label) return;
    if (noteTags.some((t) => t.toLowerCase() === label.toLowerCase())) {
      setNewTag("");
      return;
    }
    setNoteTags([...noteTags, label]);
    setNewTag("");
  };

  const startRenameTag = (tag: string) => {
    setEditTagFrom(tag);
    setEditTagValue(tag);
  };

  const saveRenameTag = () => {
    if (!editTagFrom) return;
    const label = normalizeTagLabel(editTagValue);
    if (!label) return;
    const next = noteTags.map((t) =>
      t.toLowerCase() === editTagFrom.toLowerCase() ? label : t
    );
    // Dedupe if rename collides
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const t of next) {
      const key = t.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(t);
    }
    setNoteTags(deduped);
    if (tagFilter === editTagFrom) setTagFilter(label);
    setManualTags((prev) =>
      prev.map((t) =>
        t.toLowerCase() === editTagFrom.toLowerCase() ? label : t
      )
    );
    setEditTagFrom(null);
    setEditTagValue("");
  };

  const deleteVocabularyTag = (tag: string) => {
    if (noteTags.length <= 1) return;
    setNoteTags(noteTags.filter((t) => t.toLowerCase() !== tag.toLowerCase()));
    setManualTags((prev) =>
      prev.filter((t) => t.toLowerCase() !== tag.toLowerCase())
    );
    if (tagFilter === tag) setTagFilter("all");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      save();
    }
  };

  if (!ready) {
    return (
      <div className="animate-pulse space-y-4 py-8">
        <div className="h-8 w-28 rounded bg-[var(--surface-2)]" />
        <div className="h-32 rounded-xl bg-[var(--surface-2)]" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
            Notes
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Mini journal
          </h1>
          <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
            Fast entry. Tag with hashtags, then edit notes anytime. ⌘/Ctrl+Enter
            to save.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setShowTags((v) => !v)}
        >
          <Pencil className="size-3.5" />
          {showTags ? "Hide tags" : "Edit tags"}
        </Button>
      </header>

      <AnimatePresence>
        {showTags && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <h2 className="font-display text-sm font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
                Hashtags
              </h2>
              <ul className="mt-3 space-y-2">
                {noteTags.map((tag) => (
                  <li
                    key={tag}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                  >
                    {editTagFrom === tag ? (
                      <>
                        <span className="text-sm text-[var(--muted)]">#</span>
                        <Input
                          value={editTagValue}
                          onChange={(e) => setEditTagValue(e.target.value)}
                          className="h-8 flex-1"
                          maxLength={32}
                          aria-label="Tag name"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              saveRenameTag();
                            }
                          }}
                        />
                        <Button size="sm" variant="accent" onClick={saveRenameTag}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditTagFrom(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="min-w-0 flex-1 text-sm font-medium text-[var(--foreground)]">
                          #{tag}
                        </span>
                        <button
                          type="button"
                          onClick={() => startRenameTag(tag)}
                          className="rounded p-1.5 text-[var(--muted)] hover:text-[var(--foreground)]"
                          aria-label={`Rename #${tag}`}
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteVocabularyTag(tag)}
                          disabled={noteTags.length <= 1}
                          className="rounded p-1.5 text-[var(--muted)] hover:text-red-600 disabled:opacity-30"
                          aria-label={`Delete #${tag}`}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-[var(--muted)]">
                    New hashtag
                  </label>
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="e.g. Health, Family…"
                    maxLength={32}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addVocabularyTag();
                      }
                    }}
                  />
                </div>
                <Button
                  variant="secondary"
                  onClick={addVocabularyTag}
                  disabled={!normalizeTagLabel(newTag)}
                >
                  <Plus />
                  Add tag
                </Button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <section className="space-y-3">
        <Textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write something concrete… use #Want #Gap #Idea"
          className="min-h-[110px]"
          autoFocus
        />
        <div className="flex flex-wrap gap-1.5">
          {noteTags.map((tag) => (
            <TagChip
              key={tag}
              tag={tag}
              active={previewTags.includes(tag)}
              onClick={() => toggleManualTag(tag)}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="accent" onClick={save} disabled={!draft.trim()}>
            <Plus />
            Save note
          </Button>
          {previewTags.length > 0 && (
            <p className="text-xs text-[var(--muted)]">
              Tags: {previewTags.map((t) => `#${t}`).join(" ")}
            </p>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setTagFilter("all")}
            className={cn(
              "rounded-md border px-2 py-1 text-xs font-medium transition",
              tagFilter === "all"
                ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                : "border-[var(--border)] text-[var(--muted)]"
            )}
          >
            All tags
          </button>
          {noteTags.map((tag) => (
            <TagChip
              key={tag}
              tag={tag}
              active={tagFilter === tag}
              onClick={() =>
                setTagFilter((prev) => (prev === tag ? "all" : tag))
              }
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["all", "Any date"],
              ["today", "Today"],
              ["7d", "7 days"],
              ["30d", "30 days"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setDateFilter(value)}
              className={cn(
                "rounded-md border px-2 py-1 text-xs font-medium transition",
                dateFilter === value
                  ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                  : "border-[var(--border)] text-[var(--muted)]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-sm font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
            History
          </h2>
          <span className="text-xs tabular-nums text-[var(--muted)]">
            {filtered.length}
            {filtered.length !== notes.length ? ` / ${notes.length}` : ""}
          </span>
        </div>
        <ul className="mt-4 space-y-3">
          <AnimatePresence initial={false}>
            {filtered.length === 0 && (
              <li className="text-sm text-[var(--muted)]">
                {notes.length === 0 ? "No notes yet." : "No matches."}
              </li>
            )}
            {filtered.map((note) => {
              const editing = editingId === note.id;
              return (
                <motion.li
                  key={note.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs text-[var(--muted)]">
                      {formatDisplayDate(note.createdAt)}
                      {note.updatedAt !== note.createdAt && (
                        <span> · edited</span>
                      )}
                    </p>
                    <div className="flex gap-1">
                      {!editing ? (
                        <button
                          type="button"
                          onClick={() => startEditNote(note)}
                          className="rounded p-1 text-[var(--muted)] transition hover:text-[var(--foreground)]"
                          aria-label="Edit note"
                          title="Edit"
                        >
                          <Pencil className="size-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={cancelEditNote}
                          className="rounded p-1 text-[var(--muted)] transition hover:text-[var(--foreground)]"
                          aria-label="Cancel edit"
                        >
                          <X className="size-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeNote(note.id)}
                        className="rounded p-1 text-[var(--muted)] transition hover:text-red-600"
                        aria-label="Delete note"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  {editing ? (
                    <div className="mt-3 space-y-3">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[100px]"
                        aria-label="Note content"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {noteTags.map((tag) => (
                          <TagChip
                            key={tag}
                            tag={tag}
                            active={editTags.includes(tag)}
                            onClick={() => toggleEditTag(tag)}
                            onRemove={
                              editTags.includes(tag)
                                ? () =>
                                    setEditTags((prev) =>
                                      prev.filter((t) => t !== tag)
                                    )
                                : undefined
                            }
                          />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Input
                          value={editAddTag}
                          onChange={(e) => setEditAddTag(e.target.value)}
                          placeholder="Add #tag…"
                          className="h-9 max-w-[180px]"
                          maxLength={32}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addEditTag();
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={addEditTag}
                          disabled={!normalizeTagLabel(editAddTag)}
                        >
                          <Plus className="size-3.5" />
                          Tag
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() => saveEditNote(note)}
                        disabled={!editContent.trim()}
                      >
                        <Check className="size-3.5" />
                        Save changes
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]">
                        {note.content}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {note.tags.length === 0 ? (
                          <span className="text-xs text-[var(--muted)]">
                            No tags
                          </span>
                        ) : (
                          note.tags.map((tag) => (
                            <TagChip
                              key={tag}
                              tag={tag}
                              active
                              onRemove={() =>
                                upsertNote({
                                  ...note,
                                  tags: note.tags.filter((t) => t !== tag),
                                  updatedAt: new Date().toISOString(),
                                })
                              }
                            />
                          ))
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {noteTags
                          .filter((t) => !note.tags.includes(t))
                          .map((tag) => (
                            <TagChip
                              key={tag}
                              tag={tag}
                              onClick={() =>
                                upsertNote({
                                  ...note,
                                  tags: [...note.tags, tag],
                                  updatedAt: new Date().toISOString(),
                                })
                              }
                            />
                          ))}
                      </div>
                    </>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </section>
    </div>
  );
}
