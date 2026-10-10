"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/track";
import { standaloneKind } from "@/lib/pwa/standalone";
import AppTabBar from "./AppTabBar";
import InstallPrompt from "./InstallPrompt";
import ServiceWorkerRegistrar from "./ServiceWorkerRegistrar";

const LAUNCH_KEY = "domlivo:pwa-launch-tracked";

/**
 * Marks a visit made inside the installed app, once per app session (an app
 * window has its own sessionStorage). The `source=pwa` parameter on the start
 * URL says it came from the home-screen icon; the display mode says it is the
 * app either way, including after the visitor navigated away from that URL.
 */
function useLaunchTracking() {
  useEffect(() => {
    const kind = standaloneKind();
    if (!kind) return;
    try {
      if (window.sessionStorage.getItem(LAUNCH_KEY)) return;
      window.sessionStorage.setItem(LAUNCH_KEY, "1");
    } catch {
      // No storage: track once per page load instead.
    }
    const source = new URLSearchParams(window.location.search).get("source");
    track({
      event: "pwa_launch",
      source: "pwa",
      display_mode: kind,
      entry: source === "pwa" ? "icon" : source === "pwa-shortcut" ? "shortcut" : "other",
    });
  }, []);
}

/**
 * Everything the installed app adds to the site, mounted once by the layout:
 * the service worker, the bottom tab bar (standalone only), the install
 * invitation (browser only) and launch analytics.
 */
export default function PwaRoot({ locale, aiSearchEnabled }: { locale: string; aiSearchEnabled: boolean }) {
  useLaunchTracking();
  return (
    <>
      <ServiceWorkerRegistrar />
      <AppTabBar locale={locale} aiSearchEnabled={aiSearchEnabled} />
      <InstallPrompt />
    </>
  );
}
