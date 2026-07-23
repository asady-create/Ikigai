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

const EMPTY: AppData = { map: null, notes: [], insights: [] };

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
  // Start empty; load only on the client after mount — avoids SSR empty
  // state being flushed over real localStorage data.
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<AppData>(EMPTY);
  const dataRef = useRef(data);
  const readyRef = useRef(false);
  dataRef.current = data;

  const refresh = useCallback(() => {
    setData(loadAppData());
  }, []);

  useEffect(() => {
    const loaded = loadAppData();
    setData(loaded);
    readyRef.current = true;
    setReady(true);
  }, []);

  // Flush only after hydration, and never flush empty payloads
  useEffect(() => {
    const flush = () => {
      if (!readyRef.current) return;
      flushAppData(dataRef.current);
    };
    window.addEventListener("beforeunload", flush);
    window.addEventListener("pagehide", flush);
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVis);
      flush();
    };
  }, []);

  const upsertMap = useCallback((map: PurposeMap) => {
    if (!readyRef.current) return;
    const next = storageSaveMap(map);
    setData({ ...next });
  }, []);

  const upsertNote = useCallback((note: Note) => {
    if (!readyRef.current) return;
    const next = storageSaveNote(note);
    setData({ ...next });
  }, []);

  const removeNote = useCallback((id: string) => {
    if (!readyRef.current) return;
    const next = storageDeleteNote(id);
    setData({ ...next });
  }, []);

  const setInsights = useCallback((insights: InsightIdea[]) => {
    if (!readyRef.current) return;
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
