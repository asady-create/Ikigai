/// <reference lib="webworker" />

/**
 * Custom service worker. @serwist/next injects the webpack asset list into
 * self.__SW_MANIFEST at build time. We precache it ourselves so a single
 * hung request cannot block install (which left Cache Storage empty).
 */

type PrecacheEntry = string | { url: string; revision?: string | null };

interface SwGlobal extends ServiceWorkerGlobalScope {
  __SW_MANIFEST?: PrecacheEntry[];
}

declare const self: SwGlobal;

export {};

const PRECACHE = "ikigai-precache-v3";
const PAGES = "ikigai-pages-v1";
const RUNTIME = "ikigai-runtime-v1";

const APP_SHELL = [
  "/",
  "/map",
  "/notes",
  "/skills",
  "/insights",
  "/timeline",
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

const OPTIONAL_SHELL = ["/daily", "/growth", "/reflect"];

function manifestUrls(): string[] {
  return (self.__SW_MANIFEST ?? []).map((entry) =>
    typeof entry === "string" ? entry : entry.url
  );
}

async function cacheUrl(cache: Cache, url: string): Promise<void> {
  try {
    const response = await fetch(url, {
      credentials: "same-origin",
      cache: "reload",
      signal: AbortSignal.timeout(8000),
    });
    if (response.ok) await cache.put(url, response);
  } catch {
    /* skip missing / timed-out URLs so install still finishes */
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);
      const urls = [...new Set([...manifestUrls(), ...APP_SHELL])];
      for (const url of urls) {
        await cacheUrl(cache, url);
      }
      const pages = await caches.open(PAGES);
      for (const url of OPTIONAL_SHELL) {
        await cacheUrl(pages, url);
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([PRECACHE, PAGES, RUNTIME]);
      const names = await caches.keys();
      await Promise.all(
        names.filter((name) => !keep.has(name)).map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request, url.pathname));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function networkFirstPage(
  request: Request,
  pathname: string
): Promise<Response> {
  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      const pages = await caches.open(PAGES);
      await pages.put(pathname, fresh.clone());
    }
    return fresh;
  } catch {
    return (
      (await caches.match(pathname)) ||
      (await caches.match(request)) ||
      (await caches.match("/offline")) ||
      new Response("Offline", { status: 503, statusText: "Offline" })
    );
  }
}

async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cached = await caches.match(request);
  const fetching = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(RUNTIME);
        await cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached ?? (await fetching) ?? new Response("", { status: 504 });
}
