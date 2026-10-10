"use client";

import { useEffect } from "react";
import { isCrawlerClient } from "@/lib/seo/crawlerClient";

/**
 * Registers `/sw.js` (offline fallback and asset cache, see that file).
 *
 * Production only: under `next dev` a worker would cache Turbopack's output
 * and fight hot reload. To try it locally, `next build && next start`.
 *
 * Updates are applied on the next page load, never under a page in use. A new
 * worker that has installed waits; this component tells it to take over when
 * a page starts (nothing typed yet) or when the visitor leaves the tab or the
 * app. It never reloads the page: the worker only decides how the *next*
 * request is answered, so the swap is invisible, and a half-filled lead form
 * is never thrown away. `/sw.js` is fetched with `updateViaCache: "none"` and
 * re-checked when the window regains focus, so a long-lived installed app
 * still picks up a deploy.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    // Crawlers ignore workers anyway; registering would only cost a fetch.
    if (isCrawlerClient()) return;

    let cancelled = false;
    let registration: ServiceWorkerRegistration | undefined;

    const activateWaiting = () => {
      const waiting = registration?.waiting;
      // Only a replacement waits: the very first worker activates on its own.
      if (waiting && navigator.serviceWorker.controller) waiting.postMessage("SKIP_WAITING");
    };

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        if (cancelled) return;
        // A worker that installed during an earlier visit: this page has just
        // loaded, which is the "next load" it was waiting for.
        activateWaiting();
      } catch {
        // No worker only costs offline support.
      }
    };

    const onFocus = () => {
      void registration?.update().catch(() => undefined);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") activateWaiting();
      else onFocus();
    };

    // After the page's own work, so the worker never competes with hydration.
    const start = () => void register();
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.removeEventListener("load", start);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
