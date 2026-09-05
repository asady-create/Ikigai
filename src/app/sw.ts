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
 */

type PrecacheEntry = string | { url: string; revision?: string | null };

interface SwGlobal extends ServiceWorkerGlobalScope {
  __SW_MANIFEST?: PrecacheEntry[];
}

declare const self: SwGlobal;

export {};

const PRECACHE = "ikigai-precache-v4";
const PAGES = "ikigai-pages-v2";
const RSC = "ikigai-rsc-v1";
const RUNTIME = "ikigai-runtime-v2";

const APP_SHELL = [
  "/",
  "/map",
  "/notes",
  "/daily",
  "/growth",
  "/skills",
  "/insights",
  "/timeline",
  "/reflect",
  "/offline",
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

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

async function matchPage(pathname: string): Promise<Response | undefined> {
  const ignore = { ignoreSearch: true, ignoreVary: true } as const;
  const absolute = new URL(pathname, self.location.origin).href;
  const candidates: Array<string | Request> = [
    pathname,
    absolute,
    pageRequest(pathname),
  ];

  for (const key of candidates) {
    const hit = await caches.match(key, ignore);
    if (hit) return hit;
  }

  for (const name of await caches.keys()) {
    const cache = await caches.open(name);
    for (const request of await cache.keys()) {
      try {
        if (new URL(request.url).pathname === pathname) {
          const hit = await cache.match(request, ignore);
          if (hit) return hit;
        }
      } catch {
        /* ignore bad keys */
      }
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
    request.headers.has("Next-Url")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);
      // HTML shell first — Next document fetches can stall if we do them last.
      const urls = [...new Set([...APP_SHELL, ...manifestUrls()])];
      for (const url of urls) {
        const response = await fetchOk(url);
        if (!response) continue;
        await cache.put(pageRequest(url), toCacheable(response));
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

  if (isDocumentRequest(request)) {
    event.respondWith(handleDocument(request, url.pathname));
    return;
  }

  if (isRscRequest(request, url)) {
    event.respondWith(handleRsc(request, url.pathname));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function handleDocument(
  request: Request,
  pathname: string
): Promise<Response> {
  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      await putPath(PAGES, pathname, fresh.clone());
    }
    return fresh;
  } catch {
    return (
      (await matchPage(pathname)) ||
      (await matchPage("/offline")) ||
      (await offlineFallback())
    );
  }
}

async function handleRsc(
  request: Request,
  pathname: string
): Promise<Response> {
  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      const cache = await caches.open(RSC);
      await cache.put(rscRequest(pathname), toCacheable(fresh.clone()));
    }
    return fresh;
  } catch {
    const cached = await caches.match(rscRequest(pathname), {
      ignoreSearch: true,
      ignoreVary: true,
    });
    if (cached) return cached;

    // No flight payload. Signal the client to do a full document load
    // of the cached HTML instead of a dead RSC parse.
    return new Response(null, {
      status: 503,
      statusText: "Offline",
      headers: {
        "X-Ikigai-Offline": "1",
        "X-Ikigai-Offline-Path": pathname,
      },
    });
  }
}

async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cached = await caches.match(request, {
    ignoreSearch: true,
    ignoreVary: true,
  });
  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      const cache = await caches.open(RUNTIME);
      await cache.put(request, toCacheable(fresh.clone()));
    }
    return fresh;
  } catch {
    if (cached) return cached;
    return new Response("", { status: 504, statusText: "Offline" });
  }
}
