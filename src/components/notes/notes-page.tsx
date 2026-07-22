"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { nanoid } from "nanoid";
import { Plus, Trash2 } from "lucide-react";
import { useIkigai } from "@/components/providers/ikigai-provider";
import { formatDisplayDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export function NotesPage() {
  const { ready, notes, upsertNote, removeNote } = useIkigai();
  const [draft, setDraft] = useState("");

  const save = () => {
    const content = draft.trim();
    if (!content) return;
    const now = new Date().toISOString();
    upsertNote({
      id: nanoid(10),
      content,
      createdAt: now,
      updatedAt: now,
    });
    setDraft("");
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
      <header>
        <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
          Notes
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--foreground)]">
          Quick notes
        </h1>
        <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
          Capture thoughts that don’t fit the map yet.
        </p>
      </header>

      <section className="space-y-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write something concrete…"
          className="min-h-[120px]"
        />
        <Button
          variant="accent"
          onClick={save}
          disabled={!draft.trim()}
        >
          <Plus />
          Save note
        </Button>
      </section>

      <section>
        <h2 className="font-display text-sm font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
          History
        </h2>
        <ul className="mt-4 space-y-3">
          <AnimatePresence initial={false}>
            {notes.length === 0 && (
              <li className="text-sm text-[var(--muted)]">No notes yet.</li>
            )}
            {notes.map((note) => (
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
                  </p>
                  <button
                    type="button"
                    onClick={() => removeNote(note.id)}
                    className="text-[var(--muted)] transition hover:text-red-600"
                    aria-label="Delete note"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]">
                  {note.content}
                </p>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </section>
    </div>
  );
}
