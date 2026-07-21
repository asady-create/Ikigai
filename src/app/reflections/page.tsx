import { Suspense } from "react";
import type { Metadata } from "next";
import { ReflectionsPage } from "@/components/reflections/reflections-page";

export const metadata: Metadata = {
  title: "Reflections",
  description:
    "Powerful open-ended reflection prompts. Write with intensity. Rate energy and clarity. Analyze patterns.",
};

function ReflectionsFallback() {
  return (
    <div className="animate-pulse space-y-4 py-8">
      <div className="h-8 w-48 rounded bg-zinc-800" />
      <div className="h-4 w-full max-w-xl rounded bg-zinc-900" />
      <div className="h-64 rounded-xl bg-zinc-900" />
    </div>
  );
}

export default function ReflectionsRoute() {
  return (
    <Suspense fallback={<ReflectionsFallback />}>
      <ReflectionsPage />
    </Suspense>
  );
}
