"use client";

import { useEffect } from "react";

/**
 * Next.js 15 App Router no longer uses the `main-app` webpack entry that
 * @serwist/next injects into, so automatic registration can silently fail
 * and Cache Storage stays empty. Register the generated worker ourselves.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => {
      console.warn("[ikigai] service worker registration failed", err);
    });
  }, []);
  return null;
}
