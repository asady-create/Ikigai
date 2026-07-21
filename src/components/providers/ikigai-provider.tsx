"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type {
  AppData,
  InsightResult,
  PurposeCanvas,
  ReflectionEntry,
} from "@/lib/types";
import {
  deleteReflection as storageDelete,
  getInsights,
  loadAppData,
  saveCanvas as storageSaveCanvas,
  saveInsights as storageSaveInsights,
  saveReflection as storageSave,
} from "@/lib/storage";

interface IkigaiStore {
  ready: boolean;
  data: AppData;
  reflections: ReflectionEntry[];
  refresh: () => void;
  upsertReflection: (entry: ReflectionEntry) => void;
  removeReflection: (id: string) => void;
  setInsights: (insights: InsightResult) => void;
  upsertCanvas: (canvas: PurposeCanvas) => void;
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

  const upsertReflection = useCallback((entry: ReflectionEntry) => {
    const next = storageSave(entry);
    setData({ ...next });
  }, []);

  const removeReflection = useCallback((id: string) => {
    const next = storageDelete(id);
    setData({ ...next });
  }, []);

  const setInsights = useCallback((insights: InsightResult) => {
    const next = storageSaveInsights(insights);
    setData({ ...next });
  }, []);

  const upsertCanvas = useCallback((canvas: PurposeCanvas) => {
    storageSaveCanvas(canvas);
    setData(loadAppData());
  }, []);

  const reflections = [...data.reflections].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <IkigaiContext.Provider
      value={{
        ready,
        data,
        reflections,
        refresh,
        upsertReflection,
        removeReflection,
        setInsights,
        upsertCanvas,
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

/** Safe insights read when provider may not matter. */
export function useLatestInsights() {
  const { data, ready } = useIkigai();
  return { insights: ready ? data.insights ?? getInsights() : null, ready };
}
