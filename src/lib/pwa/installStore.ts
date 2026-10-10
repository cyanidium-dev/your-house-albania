"use client";

import { useSyncExternalStore } from "react";
import { track } from "@/lib/analytics/track";
import { PWA_INSTALL_CAPTURE_GLOBAL } from "./earlyCapture";
import type { BeforeInstallPromptEvent } from "./standalone";

/**
 * One install flow shared by the invitation banner and the menu entry.
 *
 * The Chromium event is captured by the inline script in the layout
 * (`earlyCapture`) and can be used once. Whoever calls `promptInstall` first
 * spends it, and both surfaces re-render from this store, so the banner and
 * the menu entry never offer a button that no longer works.
 */

export type InstallTrigger = "favorite" | "property_views" | "time" | "menu";

type State = {
  /** A real one-click install is available (Chromium, event captured). */
  canPrompt: boolean;
  /** `appinstalled` fired during this page's life. */
  installed: boolean;
  /**
   * Bumped when the menu asks for the banner (iOS, where there is no install
   * button to press, only instructions to show). 0 = never asked.
   */
  bannerRequest: number;
};

type CaptureWindow = Window & { [PWA_INSTALL_CAPTURE_GLOBAL]?: BeforeInstallPromptEvent };

const SERVER_STATE: State = { canPrompt: false, installed: false, bannerRequest: 0 };

let state: State = SERVER_STATE;
let initialised = false;
const listeners = new Set<() => void>();

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

function captured(): BeforeInstallPromptEvent | undefined {
  return (window as CaptureWindow)[PWA_INSTALL_CAPTURE_GLOBAL];
}

function init() {
  if (initialised || typeof window === "undefined") return;
  initialised = true;
  state = { ...state, canPrompt: Boolean(captured()) };
  window.addEventListener("domlivo:installable", () => set({ canPrompt: Boolean(captured()) }));
  window.addEventListener("appinstalled", () => {
    (window as CaptureWindow)[PWA_INSTALL_CAPTURE_GLOBAL] = undefined;
    set({ canPrompt: false, installed: true });
    track({ event: "pwa_installed" });
  });
}

function subscribe(listener: () => void) {
  init();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): State {
  init();
  return state;
}

export function useInstallState(): State {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_STATE);
}

/**
 * Opens Chromium's own install dialog. Resolves to the visitor's answer, or
 * `null` when there was nothing to prompt with.
 */
export async function promptInstall(trigger: InstallTrigger): Promise<"accepted" | "dismissed" | null> {
  init();
  const event = captured();
  if (!event) return null;
  // Single use: clear it before awaiting, so a double tap cannot re-enter.
  (window as CaptureWindow)[PWA_INSTALL_CAPTURE_GLOBAL] = undefined;
  set({ canPrompt: false });
  try {
    await event.prompt();
    const { outcome } = await event.userChoice;
    track({ event: "pwa_install_prompt", action: outcome, platform: "chromium", trigger });
    return outcome;
  } catch {
    return null;
  }
}

/** Asks the banner to show its iOS instructions now, regardless of snooze. */
export function requestInstallBanner() {
  init();
  set({ bannerRequest: state.bannerRequest + 1 });
}
