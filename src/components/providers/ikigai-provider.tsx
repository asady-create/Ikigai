"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AppData, Note, PurposeMap } from "@/lib/types";
import {
  deleteNote as storageDeleteNote,
  loadAppData,
  saveMap as storageSaveMap,
  saveNote as storageSaveNote,
} from "@/lib/storage";

interface IkigaiStore {
  ready: boolean;
  data: AppData;
  notes: Note[];
  refresh: () => void;
  upsertMap: (map: PurposeMap) => void;
  upsertNote: (note: Note) => void;
  removeNote: (id: string) => void;
}

const IkigaiContext = createContext<IkigaiStore | null>(null);

export function IkigaiProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<AppData>(() => loadAppData());

  const refresh = useCallback(() => {
    setData(loadAppData());
  }, []);

  useEffect(() => {
    setData(loadAppData());
    setReady(true);
  }, []);

  const upsertMap = useCallback((map: PurposeMap) => {
    const next = storageSaveMap(map);
    setData({ ...next });
  }, []);

  const upsertNote = useCallback((note: Note) => {
    const next = storageSaveNote(note);
    setData({ ...next });
  }, []);

  const removeNote = useCallback((id: string) => {
    const next = storageDeleteNote(id);
    setData({ ...next });
  }, []);

  const notes = [...data.notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <IkigaiContext.Provider
      value={{
        ready,
        data,
        notes,
        refresh,
        upsertMap,
        upsertNote,
        removeNote,
      }}
    >
      {children}
    </IkigaiContext.Provider>
  );
}

export function useIkigai() {
  const ctx = useContext(IkigaiContext);
  if (!ctx) throw new Error("useIkigai must be used within IkigaiProvider");
  return ctx;
}
