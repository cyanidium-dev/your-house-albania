/**
 * Environment probes for the installed app. All of them read `window`, so
 * callers run them in an effect or a store subscription, never during render
 * on the server.
 */

type IosNavigator = Navigator & { standalone?: boolean };

function media(query: string): boolean {
  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

function iosStandalone(): boolean {
  return (window.navigator as IosNavigator).standalone === true;
}

/**
 * Running as a home-screen app with no browser chrome: what the bottom tab bar
 * is for. iOS predates `display-mode` and exposes its own flag as well.
 */
export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return media("(display-mode: standalone)") || iosStandalone();
}

/**
 * Any installed-app window, including the `minimal-ui` fallback from
 * `display_override`. The install invitation never shows in one.
 */
export function isInstalledApp(): boolean {
  if (typeof window === "undefined") return false;
  return (
    isStandaloneDisplay() ||
    media("(display-mode: minimal-ui)") ||
    media("(display-mode: fullscreen)") ||
    media("(display-mode: window-controls-overlay)")
  );
}

/** How the app is displayed, for analytics. `null` in a browser tab. */
export function standaloneKind(): "standalone" | "ios-standalone" | null {
  if (typeof window === "undefined") return null;
  if (iosStandalone()) return "ios-standalone";
  if (media("(display-mode: standalone)")) return "standalone";
  return null;
}

/** iOS and iPadOS (which reports itself as a Mac with a touch screen). */
export function isIos(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return /Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1;
}

/**
 * Safari proper on iOS: the one browser there whose Share sheet reliably has
 * "Add to Home Screen". Other iOS browsers and in-app web views (Instagram,
 * Facebook, Google app) either put it elsewhere or cannot add at all, so they
 * get no instructions rather than wrong ones.
 */
export function isIosSafari(): boolean {
  if (!isIos()) return false;
  const ua = window.navigator.userAgent;
  if (!/Safari\//.test(ua)) return false;
  return !/CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|YaBrowser|DuckDuckGo|GSA\/|FBAN|FBAV|Instagram|Line\/|Telegram|TikTok|Snapchat/i.test(ua);
}

/** The Chromium install event, which is not in the DOM lib's types. */
export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform?: string }>;
};

/**
 * A query flag that forces a piece of PWA UI on for a screenshot, honoured in
 * `next dev` only. `NODE_ENV` is inlined at build time, so in a production
 * bundle this is `null` and the branch reading it is dropped.
 */
export function devFlag(name: string): string | null {
  if (process.env.NODE_ENV !== "development") return null;
  if (typeof window === "undefined") return null;
  try {
    return new URLSearchParams(window.location.search).get(name);
  } catch {
    return null;
  }
}
