/* eslint-disable no-restricted-globals */

/**
 * Domlivo service worker: offline fallback and build-asset cache.
 *
 * Deliberately narrow. It answers exactly two kinds of request and lets every
 * other one go straight to the network, untouched:
 *
 * 1. Same-origin `/_next/static/…` GETs: content-hashed build output, so a
 *    cached copy is never stale. Cache first.
 * 2. Same-origin page navigations: network first. A live page always wins;
 *    after NAVIGATION_TIMEOUT_MS a cached copy of the same URL is served if
 *    there is one, and with no network at all the visitor gets the cached copy
 *    or `/offline.html`.
 *
 * Never handled: anything not GET, cross-origin requests (Sanity images, GTM,
 * Clarity, maps), `/api/…`, React Server Component fetches (`?_rsc=` and the
 * `RSC` header: client-side navigations and prefetches), `/editor` (Sanity
 * Studio) and Next's own internals. A bug here can therefore only cost
 * caching, never a broken page.
 *
 * Bump VERSION whenever the caching rules change. Activating a new version
 * deletes every `domlivo-` cache with another version in its name.
 */

const VERSION = "v1";

const CACHE = {
  shell: `domlivo-shell-${VERSION}`,
  pages: `domlivo-pages-${VERSION}`,
  assets: `domlivo-assets-${VERSION}`,
};
const CACHE_NAMES = Object.values(CACHE);

const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png"];

/** Entry ceilings, so a long session cannot fill the origin's storage. */
const LIMITS = { pages: 40, assets: 250 };
/** Larger responses are passed through but not stored. */
const MAX_BYTES = { pages: 1.5 * 1024 * 1024, assets: 3 * 1024 * 1024 };

/** How long a navigation waits for the network before a cached copy is served. */
const NAVIGATION_TIMEOUT_MS = 4000;

/* ---------------------------------------------------------------- lifecycle */

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE.shell);
      // One by one: `addAll` rejects the whole batch on a single failure,
      // which would leave the worker uninstallable.
      await Promise.all(
        PRECACHE.map(async (url) => {
          try {
            await cache.add(new Request(url, { cache: "reload" }));
          } catch {
            // A missing entry only costs the offline page.
          }
        }),
      );
    })(),
  );
  // No skipWaiting() here: a replacement worker waits until a page asks for
  // it (ServiceWorkerRegistrar), which happens on the next page load.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("domlivo-") && !CACHE_NAMES.includes(key))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

/* ------------------------------------------------------------------ helpers */

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  // Keys come back in insertion order: drop the oldest.
  await Promise.all(keys.slice(0, keys.length - max).map((key) => cache.delete(key)));
}

function isStorable(response, maxBytes) {
  if (!response || !response.ok || response.status !== 200) return false;
  // Only plain same-origin responses: no opaque, no redirects followed.
  if (response.type !== "basic" || response.redirected) return false;
  const control = response.headers.get("Cache-Control") || "";
  if (/no-store|private/i.test(control)) return false;
  const length = Number(response.headers.get("Content-Length") || 0);
  if (length > maxBytes) return false;
  return true;
}

/**
 * Store a copy without holding up the response. The clone is taken here,
 * synchronously, before the page starts reading the body (a clone after that
 * throws "body already used"), and `waitUntil` keeps the worker alive until
 * the write lands.
 */
function storeInBackground(event, cacheName, request, response, kind) {
  if (!isStorable(response, MAX_BYTES[kind])) return;
  const copy = response.clone();
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(cacheName);
        await cache.put(request, copy);
        await trim(cacheName, LIMITS[kind]);
      } catch {
        // Quota or an unstorable body: caching is best effort.
      }
    })(),
  );
}

async function offlinePage() {
  const cached = await caches.match(OFFLINE_URL, { cacheName: CACHE.shell });
  return (
    cached ||
    new Response("You are offline.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  );
}

/* --------------------------------------------------------------- strategies */

async function cacheFirst(event, request) {
  const cached = await caches.match(request, { cacheName: CACHE.assets });
  if (cached) return cached;
  const response = await fetch(request);
  storeInBackground(event, CACHE.assets, request, response, "assets");
  return response;
}

/**
 * Network first, with a patience limit. On flaky mobile data a request can
 * hang for half a minute before failing; after the timeout a cached copy of
 * the page is better than a frozen screen. With no cached copy the network is
 * given all the time it needs: a slow page beats an offline page that is not
 * true.
 */
async function networkFirst(event, request) {
  const network = fetch(request).then((response) => {
    storeInBackground(event, CACHE.pages, request, response, "pages");
    return response;
  });
  // Keep the worker alive for the cache write even if the cached copy wins.
  event.waitUntil(network.catch(() => undefined));

  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(resolve, NAVIGATION_TIMEOUT_MS, "timeout");
  });

  try {
    const first = await Promise.race([network, timeout]);
    if (first !== "timeout") return first;
    const cached = await cachedPage(request);
    if (cached) return cached;
    return await network;
  } catch {
    return (await cachedPage(request)) || offlinePage();
  } finally {
    clearTimeout(timer);
  }
}

/** Query parameters that only say where a visit came from. */
const TRACKING_PARAM = /^(utm_[a-z_]+|source|gclid|fbclid|msclkid|_gl)$/i;
const LOCALE_HOME = /^\/[a-z]{2}\/?$/;

/**
 * The cached copy of a page. A URL that differs only by tracking parameters
 * (`/en?source=pwa`) is the same page. The bare root is only ever a redirect
 * to a locale, so for it the most recent cached home page stands in: that is
 * what an offline launch of the installed app opens.
 */
async function cachedPage(request) {
  const cache = await caches.open(CACHE.pages);
  const exact = await cache.match(request);
  if (exact) return exact;

  const url = new URL(request.url);
  const params = [...url.searchParams.keys()];
  if (params.length && params.every((name) => TRACKING_PARAM.test(name))) {
    const bare = await cache.match(url.origin + url.pathname);
    if (bare) return bare;
  }

  if (url.pathname === "/") {
    const keys = await cache.keys();
    for (let i = keys.length - 1; i >= 0; i--) {
      if (LOCALE_HOME.test(new URL(keys[i].url).pathname)) return cache.match(keys[i]);
    }
  }
  return undefined;
}

/* ------------------------------------------------------------------ routing */

function isRscRequest(url, request) {
  return (
    url.searchParams.has("_rsc") ||
    request.headers.get("RSC") === "1" ||
    request.headers.has("Next-Router-Prefetch") ||
    request.headers.has("Next-Router-State-Tree")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (request.headers.has("Range")) return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;
  if (path.startsWith("/api/") || path.startsWith("/editor") || path.startsWith("/_vercel")) return;
  if (path === "/sw.js") return;
  if (isRscRequest(url, request)) return;

  // The offline page and the icon it shows, from the copy taken at install,
  // so the offline page is whole without a network.
  if (PRECACHE.includes(path) && !url.search) {
    event.respondWith(
      caches.match(path, { cacheName: CACHE.shell }).then((hit) => hit || fetch(request)),
    );
    return;
  }

  if (path.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(event, request));
    return;
  }
  if (path.startsWith("/_next/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(event, request));
  }
});
