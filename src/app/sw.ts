/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  NetworkFirst,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Extra HTML routes that may exist on a fuller checkout (Daily / Growth).
 * Fetched on install; 404s are ignored so they cannot fail the whole SW.
 */
const OPTIONAL_SHELL = ["/daily", "/growth", "/reflect"];

async function precacheOptionalShell(): Promise<void> {
  const cache = await caches.open("ikigai-pages");
  await Promise.all(
    OPTIONAL_SHELL.map(async (url) => {
      try {
        const response = await fetch(url, { credentials: "same-origin" });
        if (response.ok) await cache.put(url, response);
      } catch {
        /* route may not exist in this build */
      }
    })
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheOptionalShell());
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url, sameOrigin }) =>
        sameOrigin && url.pathname.startsWith("/api/"),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: "ikigai-pages",
        networkTimeoutSeconds: 3,
      }),
    },
    {
      matcher: ({ request, sameOrigin }) =>
        sameOrigin &&
        (request.destination === "script" ||
          request.destination === "style" ||
          request.destination === "worker"),
      handler: new StaleWhileRevalidate({
        cacheName: "ikigai-static",
      }),
    },
    {
      matcher: ({ request }) =>
        request.destination === "font" || request.destination === "image",
      handler: new StaleWhileRevalidate({
        cacheName: "ikigai-assets",
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
