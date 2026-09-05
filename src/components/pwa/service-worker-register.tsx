"use client";

import { useEffect } from "react";

/**
 * Register the generated worker, and when offline convert Next.js <Link>
 * soft-navigations (RSC) into real document loads the SW can serve.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) => {
        console.warn("[ikigai] service worker registration failed", err);
      });

    const loadDocument = (href: string) => {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return false;
      if (url.pathname.startsWith("/api/")) return false;
      window.location.assign(`${url.pathname}${url.search}${url.hash}`);
      return true;
    };

    const onClick = (event: MouseEvent) => {
      if (navigator.onLine) return;
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (loadDocument(anchor.href)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const originalFetch = window.fetch.bind(window);
    const patchedFetch: typeof fetch = async (input, init) => {
      try {
        return await originalFetch(input, init);
      } catch (error) {
        if (navigator.onLine) throw error;
        const request =
          input instanceof Request ? input : new Request(input, init);
        const rsc =
          request.headers.get("RSC") === "1" ||
          request.headers.has("Next-Router-State-Tree") ||
          (typeof input === "string" && input.includes("_rsc=")) ||
          (input instanceof URL && input.searchParams.has("_rsc")) ||
          (input instanceof Request &&
            new URL(input.url).searchParams.has("_rsc"));
        if (rsc) {
          const url = new URL(request.url, window.location.origin);
          loadDocument(url.pathname);
        }
        throw error;
      }
    };

    window.fetch = patchedFetch;
    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("click", onClick, true);
      if (window.fetch === patchedFetch) {
        window.fetch = originalFetch;
      }
    };
  }, []);

  return null;
}
