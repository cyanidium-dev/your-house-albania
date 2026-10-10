"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { brandButtonClass } from "@/components/shared/BrandButton";
import { track } from "@/lib/analytics/track";
import { propertySlugFromPath } from "@/lib/analytics/attribution";
import { useConsent } from "@/lib/cookie-consent";
import { getFavorites } from "@/lib/favorites";
import { promptInstall, useInstallState, type InstallTrigger } from "@/lib/pwa/installStore";
import { devFlag, isInstalledApp, isIosSafari } from "@/lib/pwa/standalone";
import { cn } from "@/lib/utils";

/**
 * The invitation to install the site as an app.
 *
 * Shown on engagement, never on arrival: after the visitor saves a listing,
 * opens a second listing, or has spent about forty seconds on the site. Those
 * are the visitors for whom an icon on the home screen is worth something; a
 * banner thrown at a cold first paint is the most disliked PWA pattern there
 * is, and it would sit on top of the cookie banner on a first visit.
 *
 * - Chromium: a real one-click Install button, from the `beforeinstallprompt`
 *   event the layout holds back (no mini-infobar).
 * - iOS Safari: there is no install API, so the banner says where Share and
 *   "Add to Home Screen" are.
 * - Anything else (Firefox, iOS in-app browsers): nothing, rather than
 *   instructions that do not apply.
 *
 * Dismissing it snoozes it for 30 days. It never appears in the installed
 * app, while the cookie banner is up, or over a contact dialog. The menu entry
 * (InstallMenuButton) can still open it on request.
 */

const SNOOZE_KEY = "domlivo:pwa-install-snoozed-until";
const SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;
const VIEWS_KEY = "domlivo:pwa-property-views";
const VISIT_START_KEY = "domlivo:pwa-visit-start";
const PROPERTY_VIEWS_NEEDED = 2;
const TIME_ON_SITE_MS = 40_000;

function readStorage(kind: "local" | "session", key: string): string | null {
  try {
    return (kind === "local" ? window.localStorage : window.sessionStorage).getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(kind: "local" | "session", key: string, value: string) {
  try {
    (kind === "local" ? window.localStorage : window.sessionStorage).setItem(key, value);
  } catch {
    // Private mode or blocked storage: the banner may simply come back.
  }
}

function isSnoozed(): boolean {
  const until = Number(readStorage("local", SNOOZE_KEY) ?? 0);
  return Number.isFinite(until) && until > Date.now();
}

function snooze() {
  writeStorage("local", SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
}

/** Distinct listings opened in this visit, kept across full page loads. */
function countPropertyView(slug: string): number {
  let seen: string[] = [];
  try {
    const parsed = JSON.parse(readStorage("session", VIEWS_KEY) ?? "[]");
    if (Array.isArray(parsed)) seen = parsed.filter((s): s is string => typeof s === "string");
  } catch {
    seen = [];
  }
  if (!seen.includes(slug)) {
    seen = [...seen, slug].slice(-10);
    writeStorage("session", VIEWS_KEY, JSON.stringify(seen));
  }
  return seen.length;
}

/** When this visit started, so a reload does not restart the forty seconds. */
function visitStart(): number {
  const stored = Number(readStorage("session", VISIT_START_KEY) ?? 0);
  if (Number.isFinite(stored) && stored > 0) return stored;
  const now = Date.now();
  writeStorage("session", VISIT_START_KEY, String(now));
  return now;
}

type Mode = "install" | "ios";

function ShareIosIcon({ label }: { label: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      className="mx-0.5 inline-block size-[1.15em] shrink-0 align-[-0.2em] text-primary"
    >
      <path d="M12 3v12" />
      <path d="m8.5 6.5 3.5-3.5 3.5 3.5" />
      <path d="M7 10.5H5.5A1.5 1.5 0 0 0 4 12v7.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V12a1.5 1.5 0 0 0-1.5-1.5H17" />
    </svg>
  );
}

export default function InstallPrompt() {
  const t = useTranslations("Pwa");
  const pathname = usePathname();
  const { promptOpen: consentOpen } = useConsent();
  const { canPrompt, installed, bannerRequest } = useInstallState();

  /** What engaged the visitor; `null` until something has. */
  const [trigger, setTrigger] = useState<InstallTrigger | null>(null);
  const [eligible, setEligible] = useState(false);
  const [ios, setIos] = useState(false);
  /** `next dev` only (`?pwa-prompt=install|ios`), for screenshots. */
  const [forced, setForced] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const shownTracked = useRef(false);

  // Once per page load: can this browser install at all, and is it allowed to ask?
  useEffect(() => {
    if (isInstalledApp()) return;
    const flag = devFlag("pwa-prompt");
    setForced(flag);
    setIos(isIosSafari() || flag === "ios");
    setEligible(!isSnoozed() || flag !== null);
  }, []);

  // Trigger: time on site.
  useEffect(() => {
    if (!eligible) return;
    if (forced !== null) {
      setTrigger((current) => current ?? "time");
      return;
    }
    const remaining = Math.max(0, TIME_ON_SITE_MS - (Date.now() - visitStart()));
    const timer = window.setTimeout(() => setTrigger((current) => current ?? "time"), remaining);
    return () => window.clearTimeout(timer);
  }, [eligible, forced]);

  // Trigger: a listing saved. The short delay lets the heart's fly animation land.
  useEffect(() => {
    if (!eligible) return;
    let count = getFavorites().length;
    let timer = 0;
    const onUpdate = () => {
      const next = getFavorites().length;
      if (next > count) {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => setTrigger((current) => current ?? "favorite"), 1200);
      }
      count = next;
    };
    window.addEventListener("favorites-updated", onUpdate);
    return () => {
      window.removeEventListener("favorites-updated", onUpdate);
      window.clearTimeout(timer);
    };
  }, [eligible]);

  // Trigger: a second listing opened.
  useEffect(() => {
    if (!eligible || !pathname) return;
    const slug = propertySlugFromPath(pathname);
    if (!slug) return;
    if (countPropertyView(slug) >= PROPERTY_VIEWS_NEEDED) {
      setTrigger((current) => current ?? "property_views");
    }
  }, [eligible, pathname]);

  // The menu entry asked for the iOS instructions: show them now.
  useEffect(() => {
    if (bannerRequest === 0) return;
    if (isInstalledApp()) return;
    setHidden(false);
    setEligible(true);
    setTrigger("menu");
  }, [bannerRequest]);

  const mode: Mode | null = canPrompt || forced === "install" ? "install" : ios ? "ios" : null;
  const visible = eligible && !hidden && !installed && trigger !== null && mode !== null && !consentOpen;

  useEffect(() => {
    if (!visible || shownTracked.current || !mode || !trigger) return;
    shownTracked.current = true;
    track({
      event: "pwa_install_prompt",
      action: "shown",
      platform: mode === "install" ? "chromium" : "ios",
      trigger,
    });
  }, [visible, mode, trigger]);

  const dismiss = useCallback(() => {
    setHidden(true);
    snooze();
    if (mode && trigger) {
      track({
        event: "pwa_install_prompt",
        action: "dismissed",
        platform: mode === "install" ? "chromium" : "ios",
        trigger,
      });
    }
  }, [mode, trigger]);

  const install = async () => {
    setHidden(true);
    const outcome = await promptInstall(trigger ?? "time");
    // A "no" in the browser's own dialog is as clear as our close button.
    if (outcome === "dismissed") snooze();
  };

  // Escape closes it, like every other floating panel on the site.
  useEffect(() => {
    if (!visible) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [visible, dismiss]);

  if (!visible || !mode) return null;

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="pwa-install-title"
      className={cn(
        "fixed inset-x-4 z-[45] mx-auto max-w-md sm:left-auto sm:right-6 sm:mx-0 sm:w-[24rem]",
        // Above the listing contact bar when there is one, clear of the home
        // indicator otherwise.
        "bottom-[calc(var(--app-tabbar-offset,0px)+var(--mobile-sticky-bar-height,0px)+max(0.75rem,env(safe-area-inset-bottom,0px)))]",
        "rounded-2xl border border-dark/10 bg-white p-4 text-dark shadow-3xl",
        "dark:border-white/15 dark:bg-dark dark:text-white",
        "animate-in fade-in slide-in-from-bottom-4 duration-300 motion-reduce:animate-none",
        "print:hidden [[data-contact-modal]_&]:invisible",
      )}
    >
      <div className="flex items-start gap-3">
        {/* The app icon itself, 192px and already on disk: nothing to optimise. */}
        <Image src="/icons/icon-192.png" alt="" width={48} height={48} unoptimized className="size-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <h2 id="pwa-install-title" className="text-base font-semibold leading-snug">
            {t("installTitle")}
          </h2>
          <p className="mt-1 text-sm leading-snug text-dark/65 dark:text-white/65">{t("installText")}</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("installClose")}
          className="-mr-1.5 -mt-1.5 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-dark/50 transition-colors hover:bg-dark/5 hover:text-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden className="size-4">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      {mode === "ios" ? (
        <p className="mt-3 rounded-xl bg-primary/8 px-3 py-2.5 text-sm leading-relaxed text-dark/80 dark:bg-white/8 dark:text-white/80">
          {t.rich("installIos", {
            share: () => <ShareIosIcon label={t("installIosShare")} />,
          })}
        </p>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={install} className={brandButtonClass("primary", "flex-1", "md")}>
            {t("installAction")}
          </button>
          <button type="button" onClick={dismiss} className={brandButtonClass("ghost", "", "md")}>
            {t("installNotNow")}
          </button>
        </div>
      )}
    </section>
  );
}
