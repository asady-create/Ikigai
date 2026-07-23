"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppData, InsightIdea, Note, PurposeMap } from "@/lib/types";
import {
  deleteNote as storageDeleteNote,
  flushAppData,
  loadAppData,
  saveInsights as storageSaveInsights,
  saveMap as storageSaveMap,
  saveNote as storageSaveNote,
} from "@/lib/storage";

interface IkigaiStore {
  ready: boolean;
  data: AppData;
  notes: Note[];
  insights: InsightIdea[];
  refresh: () => void;
  upsertMap: (map: PurposeMap) => void;
  upsertNote: (note: Note) => void;
  removeNote: (id: string) => void;
  setInsights: (insights: InsightIdea[]) => void;
}

const IkigaiContext = createContext<IkigaiStore | null>(null);

export function IkigaiProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<AppData>(() => loadAppData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const refresh = useCallback(() => {
    setData(loadAppData());
  }, []);

  useEffect(() => {
    setData(loadAppData());
    setReady(true);
  }, []);

  // Flush to storage if the tab closes / refreshes
  useEffect(() => {
    const flush = () => flushAppData(dataRef.current);
    window.addEventListener("beforeunload", flush);
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
    return () => {
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("pagehide", flush);
      flush();
    };
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

  const setInsights = useCallback((insights: InsightIdea[]) => {
    const next = storageSaveInsights(insights);
    setData({ ...next });
  }, []);

  const notes = [...data.notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const insights = [...(data.insights ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <IkigaiContext.Provider
      value={{
        ready,
        data,
        notes,
        insights,
        refresh,
        upsertMap,
        upsertNote,
        removeNote,
        setInsights,
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
