/// <reference lib="webworker" />

/**
 * App Router offline navigation.
 *
 * Next caches HTML with Vary: RSC / Next-Router-State-Tree, so a later
 * document request will not match unless we strip Vary and match with
 * ignoreSearch + ignoreVary.
 *
 * Client <Link> clicks are RSC fetches (?_rsc=), not mode=navigate.
 * Those are cached by pathname and fall back to a 503 the page converter
 * turns into a full document load of the cached HTML.
 *
 * Do not use AbortSignal.timeout here — it is missing on older iOS.
 */

type PrecacheEntry = string | { url: string; revision?: string | null };

interface SwGlobal extends ServiceWorkerGlobalScope {
  __SW_MANIFEST?: PrecacheEntry[];
}

declare const self: SwGlobal;

export {};

const PRECACHE = "ikigai-precache-v7";
const PAGES = "ikigai-pages-v3";
const RSC = "ikigai-rsc-v2";
const RUNTIME = "ikigai-runtime-v3";

const APP_SHELL = [
  "/offline.html",
  "/offline",
  "/",
  "/map",
  "/notes",
  "/daily",
  "/growth",
  "/skills",
  "/insights",
  "/timeline",
  "/canvas",
  "/reflections",
  "/reflect",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

const MATCH_OPTS = { ignoreSearch: true, ignoreVary: true } as const;

function manifestUrls(): string[] {
  return (self.__SW_MANIFEST ?? []).map((entry) =>
    typeof entry === "string" ? entry : entry.url
  );
}

function toCacheable(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.delete("Vary");
  headers.set("X-Ikigai-Cache", "1");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function pageRequest(pathname: string): Request {
  return new Request(new URL(pathname, self.location.origin).href, {
    credentials: "same-origin",
  });
}

function rscRequest(pathname: string): Request {
  return new Request(new URL(pathname, self.location.origin).href, {
    credentials: "same-origin",
    headers: { RSC: "1" },
  });
}

async function putPath(
  cacheName: string,
  pathname: string,
  response: Response
): Promise<void> {
  const cache = await caches.open(cacheName);
  await cache.put(pageRequest(pathname), toCacheable(response));
}

function timeoutNull(ms: number): Promise<null> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(null), ms);
  });
}

async function fetchOk(url: string): Promise<Response | null> {
  try {
    const response = await Promise.race([
      fetch(url, { credentials: "same-origin" }),
      timeoutNull(2000),
    ]);
    return response && response.ok ? response : null;
  } catch {
    return null;
  }
}

/** Read + store one URL. Timeouts include the body — Next streams can hang. */
async function storeUrl(cache: Cache, url: string): Promise<boolean> {
  const response = await fetchOk(url);
  if (!response) return false;
  try {
    const body = await Promise.race([response.arrayBuffer(), timeoutNull(2000)]);
    if (!body) return false;
    const headers = new Headers(response.headers);
    headers.delete("Vary");
    headers.set("X-Ikigai-Cache", "1");
    const stored = new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
    const put = cache.put(pageRequest(url), stored);
    const done = await Promise.race([put.then(() => true), timeoutNull(2000)]);
    return Boolean(done);
  } catch {
    return false;
  }
}

async function fetchFresh(
  request: Request,
  href: string,
  ms = 2500,
  allowPlainGet = true
): Promise<Response | null> {
  try {
    const response = await Promise.race([
      fetch(request),
      timeoutNull(ms),
    ]);
    if (response && response.ok) return response;
  } catch {
    /* try a plain GET next */
  }
  if (!allowPlainGet) return null;
  try {
    const response = await Promise.race([
      fetch(href, { credentials: "same-origin" }),
      timeoutNull(ms),
    ]);
    return response && response.ok ? response : null;
  } catch {
    return null;
  }
}

async function matchPage(pathname: string): Promise<Response | undefined> {
  const absolute = new URL(pathname, self.location.origin).href;
  const candidates: Array<string | Request> = [
    pathname,
    absolute,
    pageRequest(pathname),
  ];

  for (const key of candidates) {
    const hit = await caches.match(key, MATCH_OPTS);
    if (hit) return hit;
  }

  for (const name of await caches.keys()) {
    const cache = await caches.open(name);
    for (const request of await cache.keys()) {
      try {
        if (new URL(request.url).pathname === pathname) {
          const hit = await cache.match(request, MATCH_OPTS);
          if (hit) return hit;
        }
      } catch {
        /* ignore bad keys */
      }
    }
  }
  return undefined;
}

async function matchRsc(pathname: string): Promise<Response | undefined> {
  const hit = await caches.match(rscRequest(pathname), MATCH_OPTS);
  if (hit) return hit;

  // Only return a payload that was stored as RSC — HTML will break the
  // App Router flight parser.
  const cache = await caches.open(RSC);
  for (const request of await cache.keys()) {
    try {
      if (new URL(request.url).pathname === pathname) {
        const cached = await cache.match(request, MATCH_OPTS);
        if (cached) return cached;
      }
    } catch {
      /* ignore bad keys */
    }
  }
  return undefined;
}

async function offlineFallback(): Promise<Response> {
  return (
    (await matchPage("/offline")) ||
    (await caches.match("/offline.html", { ignoreVary: true })) ||
    new Response(
      `<!doctype html><meta charset="utf-8"><title>Offline</title>
       <body style="font-family:system-ui;padding:2rem;background:#f3f4f6">
       <p>You’re offline.</p></body>`,
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    )
  );
}

function isDocumentRequest(request: Request): boolean {
  return request.mode === "navigate" || request.destination === "document";
}

function isRscRequest(request: Request, url: URL): boolean {
  return (
    url.searchParams.has("_rsc") ||
    request.headers.get("RSC") === "1" ||
    request.headers.has("Next-Router-State-Tree") ||
    request.headers.has("Next-Router-Prefetch") ||
    request.headers.has("Next-Url")
  );
}

function offlineRsc(pathname: string): Response {
  return new Response(null, {
    status: 503,
    statusText: "Offline",
    headers: {
      "X-Ikigai-Offline": "1",
      "X-Ikigai-Offline-Path": pathname,
    },
  });
}

async function storeMany(
  cache: Cache,
  urls: string[],
  concurrency: number
): Promise<number> {
  const unique = [...new Set(urls)];
  let stored = 0;
  let cursor = 0;
  const worker = async () => {
    while (cursor < unique.length) {
      const url = unique[cursor];
      cursor += 1;
      if (await storeUrl(cache, url)) stored += 1;
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concurrency, unique.length) }, () => worker())
  );
  return stored;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(PRECACHE);
        // Only the HTML shell blocks activation. Webpack assets fill after.
        const stored = await storeMany(cache, APP_SHELL, 8);
        console.info("[ikigai-sw] shell ready", stored, "urls");
      } catch (error) {
        console.warn("[ikigai-sw] install error", error);
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([PRECACHE, PAGES, RSC, RUNTIME]);
      await Promise.all(
        (await caches.keys())
          .filter((name) => !keep.has(name))
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
      const cache = await caches.open(PRECACHE);
      const rest = manifestUrls().filter((url) => !APP_SHELL.includes(url));
      void storeMany(cache, rest, 8)
        .then((stored) => console.info("[ikigai-sw] assets ready", stored, "urls"))
        .catch((error) => console.warn("[ikigai-sw] asset precache error", error));
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  const pathname = url.pathname;

  try {
    if (isDocumentRequest(request)) {
      event.respondWith(handleDocument(request, pathname));
      return;
    }

    if (isRscRequest(request, url)) {
      event.respondWith(handleRsc(request, pathname));
      return;
    }

    event.respondWith(staleWhileRevalidate(request));
  } catch {
    if (isDocumentRequest(request)) {
      event.respondWith(offlineFallback());
    }
  }
});

async function handleDocument(
  request: Request,
  pathname: string
): Promise<Response> {
  const cached = await matchPage(pathname);
  // Cache-first for documents. A network probe here shows as a red
  // sw.js fetch in DevTools when the machine is offline.
  if (cached) return cached;

  const href = new URL(pathname, self.location.origin).href;
  const fresh = await fetchFresh(request, href);
  if (fresh) {
    void putPath(PAGES, pathname, fresh.clone()).catch(() => {});
    return fresh;
  }

  return offlineFallback();
}

async function handleRsc(
  request: Request,
  pathname: string
): Promise<Response> {
  const cached = await matchRsc(pathname);
  if (cached) return cached;

  const href = new URL(pathname, self.location.origin).href;
  const fresh = await fetchFresh(request, href, 2500, false);
  if (fresh) {
    void caches
      .open(RSC)
      .then((cache) =>
        cache.put(rscRequest(pathname), toCacheable(fresh.clone()))
      )
      .catch(() => {});
    return fresh;
  }

  return offlineRsc(pathname);
}

async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cached = await caches.match(request, MATCH_OPTS);
  if (cached) return cached;

  try {
    const fresh = await Promise.race([fetch(request), timeoutNull(2500)]);
    if (fresh && fresh.ok) {
      const cache = await caches.open(RUNTIME);
      void cache.put(request, toCacheable(fresh.clone())).catch(() => {});
      return fresh;
    }
  } catch {
    /* fall through */
  }

  return new Response("", { status: 504, statusText: "Offline" });
}
