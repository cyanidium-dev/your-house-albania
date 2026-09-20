"use client";

import * as React from "react";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function readSearch(): string {
  return window.location.search.replace(/^\?/, "");
}

/**
 * The URL's query string (no leading `?`), without `useSearchParams`.
 *
 * `useSearchParams` in a statically rendered page bails the nearest Suspense
 * boundary out to client rendering — on a cached listing page that would take
 * the "show more" link, the one crawlers follow to page 2, out of the HTML.
 * This reads `window.location` instead: the server renders with `serverSearch`
 * (what the route knows: empty on the cached route, the real query on the
 * query route), and the browser's value takes over after hydration. A
 * navigation re-renders the tree, and `useSyncExternalStore` re-reads the
 * snapshot on every render.
 */
export function useUrlSearch(serverSearch = ""): string {
  return React.useSyncExternalStore(subscribe, readSearch, () => serverSearch);
}
