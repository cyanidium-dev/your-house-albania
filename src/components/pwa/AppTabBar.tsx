"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "@/components/shared/Link";
import { useFavorites } from "@/hooks/useFavorites";
import { routing } from "@/i18n/routing";
import { catalogPath } from "@/lib/routes/catalog";
import { currentCityListingHref, LISTINGS_ANCHOR_ID } from "@/lib/routes/currentCityListing";
import { isGeoListingPathname } from "@/lib/routes/listingQueryRewrite";
import { devFlag, isStandaloneDisplay } from "@/lib/pwa/standalone";
import { cn } from "@/lib/utils";

/**
 * Bottom tab bar of the installed app.
 *
 * Rendered only in a standalone window (home-screen launch) below `lg`. There
 * is no browser chrome there — no back button, no address bar — so the app
 * needs a way between its five most-used places. The website in a browser tab
 * is untouched: the bar is not in its HTML at all, which also keeps its links
 * out of what crawlers see.
 *
 * The room it takes is reserved in CSS (`--app-tabbar-offset` in globals.css),
 * from the first paint, and the site's other fixed bottom elements sit above
 * it. `z-[35]`: above the page and its card overlays (z-30), below the menu
 * backdrop (z-40), dialogs (z-50+) and the cookie banner (z-90), which all
 * cover it.
 */

const STANDALONE_QUERY = "(display-mode: standalone)";

function subscribe(onChange: () => void) {
  let mql: MediaQueryList | null = null;
  try {
    mql = window.matchMedia(STANDALONE_QUERY);
    mql.addEventListener("change", onChange);
  } catch {
    // Very old WebKit: the iOS flag below still works.
  }
  return () => mql?.removeEventListener("change", onChange);
}

function getStandalone() {
  return isStandaloneDisplay() || devFlag("pwa-standalone") === "1";
}

function useStandalone(): boolean {
  return useSyncExternalStore(subscribe, getStandalone, () => false);
}

type TabKey = "search" | "map" | "favorites" | "assistant" | "contact";

type Tab = {
  key: TabKey;
  href: string;
  icon: ReactNode;
  active: boolean;
  badge?: number;
};

const ICON = "size-6 shrink-0";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden className={ICON}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden className={ICON}>
      <path d="M3.5 6.2 9 4l6 2.5 5.5-2.2v13.5L15 20l-6-2.5-5.5 2.2z" />
      <path d="M9 4v13.5M15 6.5V20" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden className={ICON}>
      <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden className={ICON}>
      <path d="M12 3.5c.6 4.4 2.1 5.9 6.5 6.5-4.4.6-5.9 2.1-6.5 6.5-.6-4.4-2.1-5.9-6.5-6.5 4.4-.6 5.9-2.1 6.5-6.5z" />
      <path d="M18.5 15.5c.25 1.6.9 2.25 2.5 2.5-1.6.25-2.25.9-2.5 2.5-.25-1.6-.9-2.25-2.5-2.5 1.6-.25 2.25-.9 2.5-2.5z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden className={ICON}>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V17A2.5 2.5 0 0 1 4 14.5z" />
      <path d="M8.5 9.5h7M8.5 12.5h4.5" strokeLinecap="round" />
    </svg>
  );
}

function stripLocale(pathname: string, locale: string): string {
  const rest = pathname.slice(locale.length + 1);
  return rest.startsWith("/") ? rest : `/${rest}`;
}

export default function AppTabBar({ locale, aiSearchEnabled }: { locale: string; aiSearchEnabled: boolean }) {
  const standalone = useStandalone();
  const t = useTranslations("Pwa");
  const tHeader = useTranslations("Header");
  const pathname = usePathname() ?? `/${locale}`;
  const { favorites, mounted } = useFavorites();
  // `?view=map` is read after navigation rather than through useSearchParams,
  // which in a root layout would opt every page out of static rendering.
  const [mapView, setMapView] = useState(false);

  useEffect(() => {
    setMapView(new URLSearchParams(window.location.search).get("view") === "map");
  }, [pathname]);
  // The catalogue's full-screen map reports its state (CatalogBodyClient).
  useEffect(() => {
    const onMap = (ev: Event) => setMapView(Boolean((ev as CustomEvent<{ open?: boolean }>).detail?.open));
    window.addEventListener("domlivo:catalog-map", onMap);
    return () => window.removeEventListener("domlivo:catalog-map", onMap);
  }, []);

  // iOS home-screen apps that only report `navigator.standalone` do not match
  // the CSS media query; this attribute reserves the bar's room for them.
  useEffect(() => {
    if (!standalone) return;
    const root = document.documentElement;
    root.dataset.pwaStandalone = "";
    return () => {
      delete root.dataset.pwaStandalone;
    };
  }, [standalone]);

  if (!standalone) return null;

  // Inside a city, Search and Map stay in that city.
  const cityListing = currentCityListingHref(pathname, routing.locales)?.replace(`#${LISTINGS_ANCHOR_ID}`, "");
  const listingBase = cityListing ?? catalogPath(locale);
  const rest = stripLocale(pathname, locale);
  const onListing =
    isGeoListingPathname(pathname, routing.locales) ||
    /^\/(catalog|sale|rent|short-term-rent|property)(\/|$)/.test(rest);

  const tabs: Tab[] = [
    { key: "search", href: listingBase, icon: <SearchIcon />, active: onListing && !mapView },
    { key: "map", href: `${listingBase}?view=map`, icon: <MapIcon />, active: onListing && mapView },
    {
      key: "favorites",
      href: `/${locale}/favorites`,
      icon: <HeartIcon />,
      active: rest.startsWith("/favorites"),
      badge: mounted ? favorites.length : 0,
    },
    ...(aiSearchEnabled
      ? [{ key: "assistant" as const, href: `/${locale}/ai-search`, icon: <SparkleIcon />, active: rest.startsWith("/ai-search") }]
      : []),
    {
      key: "contact",
      href: `/${locale}/contacts`,
      icon: <ChatIcon />,
      active: /^\/(contacts|contact|contactus)(\/|$)/.test(rest),
    },
  ];

  const labels: Record<TabKey, string> = {
    search: t("tabSearch"),
    map: t("tabMap"),
    favorites: t("tabFavorites"),
    assistant: t("tabAssistant"),
    contact: t("tabContact"),
  };

  return (
    <nav
      aria-label={t("tabsLabel")}
      className={cn(
        "fixed inset-x-0 bottom-0 z-[35] lg:hidden print:hidden",
        "border-t border-dark/10 bg-white/95 backdrop-blur-md dark:border-white/15 dark:bg-dark/95",
        "pb-[env(safe-area-inset-bottom,0px)]",
        // A contact dialog's backdrop is translucent; tabs showing through it
        // look tappable. Same rule as the listing contact bar.
        "[[data-contact-modal]_&]:invisible",
      )}
    >
      <ul
        className="mx-auto grid h-[var(--app-tabbar-row)] max-w-xl px-1"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab) => {
          const label = labels[tab.key];
          const count = tab.badge ?? 0;
          return (
            <li key={tab.key} className="min-w-0">
              <Link
                href={tab.href}
                onClick={(ev) => {
                  // On the catalogue page itself, Map and Search open and close
                  // its map in place: a navigation to the same page would not.
                  if (tab.key !== "map" && tab.key !== "search") return;
                  const state = document.documentElement.dataset.catalogMap;
                  if (!state) return;
                  const target = new URL(tab.href, window.location.href);
                  if (target.pathname !== window.location.pathname) return;
                  const open = tab.key === "map";
                  if (open === (state === "open")) {
                    ev.preventDefault();
                    return;
                  }
                  ev.preventDefault();
                  window.dispatchEvent(new CustomEvent("domlivo:catalog-map-request", { detail: { open } }));
                }}
                aria-current={tab.active ? "page" : undefined}
                aria-label={tab.key === "favorites" && count > 0 ? tHeader("favoritesCount", { count }) : undefined}
                className={cn(
                  "group flex h-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5",
                  "text-[11px] font-medium leading-tight transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50",
                  tab.active ? "text-primary" : "text-dark/60 dark:text-white/65",
                )}
              >
                <span className="relative transition-transform duration-150 ease-out group-active:scale-90">
                  {tab.icon}
                  {count > 0 && (
                    <span
                      aria-hidden
                      className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold tabular-nums text-white ring-2 ring-white dark:ring-dark"
                    >
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </span>
                <span className="max-w-full truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
