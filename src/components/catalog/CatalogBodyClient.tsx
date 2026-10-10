"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { PropertySearchBar } from "@/components/catalog/PropertySearchBar";
import { CatalogEmptyState } from "@/components/catalog/CatalogEmptyState";
import { PropertyPagination } from "@/components/catalog/PropertyPagination";
import PropertyCard from "@/components/shared/property/PropertyCard";
import { useCatalogView } from "@/contexts/CatalogViewContext";
import { cn } from "@/lib/utils";
import type { PropertyHomes } from "@/types/propertyHomes";
import type { PropertyCatalogBanner } from "@/types/propertyCatalogBanner";
import type { ViewMode } from "@/lib/catalog/viewMode";
import { PropertyCatalogBannerCard } from "@/components/catalog/PropertyCatalogBannerCard";
import { MapListingSheet } from "@/components/catalog/map/MapListingSheet";

const PropertiesMap = dynamic(
  () =>
    import("@/components/catalog/map/PropertiesMap")
      .then((m) => m.PropertiesMap)
      // Offline in the installed app the map's code may never have been
      // fetched (phones load it only when the map opens); a failed chunk took
      // the whole page down with "Application error". Show a note instead.
      .catch(() => MapUnavailable),
  {
    ssr: false,
    // Fills the panel, which has its size before the map arrives.
    loading: () => (
      <div className="absolute inset-0 rounded-2xl bg-dark/5 dark:bg-white/10 animate-pulse" />
    ),
  }
);

export type CatalogFilterProps = {
  /** City and district listings: open on the summary pill, not the full form. */
  collapsedByDefault?: boolean;
  locations: Array<{ value: string; label: string; countrySlug?: string }>;
  propertyTypes: Array<{ value: string; label: string }>;
  dealTypeValues: readonly string[];
  districtOptions: Array<{ value: string; label: string; citySlug?: string }>;
  priceRangesByDeal: Record<string, { min: number; max: number }>;
  defaultAreaRange: { min: number; max: number };
  amenityOptions: Array<{ value: string; label: string }>;
  initialAgentSlug: string;
  initialCountrySlug: string;
  initialCity: string;
  initialType: string;
  initialDealType: string;
  initialStage: string;
  initialMinPrice: string;
  initialMaxPrice: string;
  initialMinArea: string;
  initialMaxArea: string;
  initialBeds: string;
  initialDistrict: string;
  initialSort: string;
  initialAmenities: string[];
  initialPageSize: string;
  initialView?: ViewMode;
};

export type CatalogBodyClientProps = {
  /** Rendered between the sticky filter bar and the grid (facet chips). */
  afterFilters?: React.ReactNode;
  filterProps: CatalogFilterProps;
  /** Filtered catalog page. Map + list use this. */
  pageItems: PropertyHomes[];
  /** Up to 3 selected banners for this catalog state. */
  banners?: PropertyCatalogBanner[];
  locale: string;
  totalPages: number;
  currentPage: number;
  /** The page's resolved filters as a query string, for load-more requests. */
  loadMoreQuery: string;
  totalCount: number;
  pageSize: number;
  /** The URL's own query string as the server saw it (no `?`); empty on a cached page. */
  serverSearch?: string;
};

type BannerSlot = "top" | { afterProperty: number };
type ComposedItem =
  | { kind: "banner"; banner: PropertyCatalogBanner; key: string }
  | { kind: "property"; item: PropertyHomes; key: string };

/**
 * Cards per row for the view mode, the window width and whether the map
 * panel takes the right of the results (lg and up). Mirrors the grid classes
 * below; banners go after whole rows only.
 */
function columnCount(viewMode: ViewMode, width: number, split: boolean): number {
  if (viewMode === "list") return 1;
  if (viewMode === "large") {
    if (split && width >= 1024) return 2;
    if (width >= 1280) return 4;
    if (width >= 1024) return 3;
    if (width >= 640) return 2;
    return 1;
  }
  if (split && width >= 1024) return 3;
  if (width >= 1280) return 4;
  if (width >= 768) return 3;
  return 2;
}

function getBannerSlots(columns: number): BannerSlot[] {
  const row = Math.max(columns, 1);
  // After about 4 and 8 cards, rounded up to whole rows so no row is cut short.
  const first = row * Math.ceil(4 / row);
  const second = Math.max(row * Math.ceil(8 / row), first + row);
  return ["top", { afterProperty: first }, { afterProperty: second }];
}

function composeCatalogFlowItems(args: {
  pageItems: PropertyHomes[];
  banners: PropertyCatalogBanner[];
  slots: BannerSlot[];
}): ComposedItem[] {
  const { pageItems, banners, slots } = args;
  const selectedSlots = slots.slice(0, banners.length);

  const top: PropertyCatalogBanner[] = [];
  const afterProperty = new Map<number, PropertyCatalogBanner[]>();

  for (let i = 0; i < selectedSlots.length; i++) {
    const slot = selectedSlots[i];
    const banner = banners[i];
    if (!banner) continue;
    if (slot === "top") {
      top.push(banner);
      continue;
    }
    const count = slot.afterProperty;
    const list = afterProperty.get(count) ?? [];
    list.push(banner);
    afterProperty.set(count, list);
  }

  const out: ComposedItem[] = [];
  for (const b of top) out.push({ kind: "banner", banner: b, key: `banner-top-${b.key}` });

  let propertyCount = 0;
  for (let i = 0; i < pageItems.length; i++) {
    const item = pageItems[i];
    out.push({ kind: "property", item, key: `property-${item.slug ?? i}` });
    propertyCount += 1;
    const pending = afterProperty.get(propertyCount);
    if (pending?.length) {
      for (const b of pending) out.push({ kind: "banner", banner: b, key: `banner-after-${propertyCount}-${b.key}` });
      afterProperty.delete(propertyCount);
    }
  }

  // If page has fewer properties than slot targets, render remaining banners at end.
  for (const [, pending] of afterProperty.entries()) {
    for (const b of pending) out.push({ kind: "banner", banner: b, key: `banner-tail-${b.key}` });
  }

  return out;
}

const MAP_HIDDEN_STORAGE_KEY = "domlivo:catalog-map-hidden";
/** Header height from md up (the filter bar's sticky offset). */
const HEADER_OFFSET_PX = 84;
/** The condensed filter pill with its bottom margin (md+), as it sits while scrolled. */
const COMPACT_FILTER_BAR_PX = 72;

/**
 * Client boundary: reads viewMode from context, renders filters (with getCurrentView)
 * and results. Only results re-render when viewMode changes; filters get stable
 * getCurrentView ref so they don't re-render.
 */
export function CatalogBodyClient({
  filterProps,
  afterFilters,
  pageItems,
  banners = [],
  locale,
  totalPages,
  currentPage,
  totalCount,
  pageSize,
  loadMoreQuery,
  serverSearch = "",
}: CatalogBodyClientProps) {
  const { viewMode, getCurrentView } = useCatalogView();
  const tMap = useTranslations("Shared.map");
  const [activeSlug, setActiveSlug] = React.useState<string | null>(null);
  const [previewSlug, setPreviewSlug] = React.useState<string | null>(null);
  // A pin whose card is still being fetched: the window opens at once with a
  // placeholder instead of nothing for half a second.
  const [pendingSlug, setPendingSlug] = React.useState<string | null>(null);
  const pendingSlugRef = React.useRef<string | null>(null);
  const setPending = React.useCallback((slug: string | null) => {
    pendingSlugRef.current = slug;
    setPendingSlug(slug);
  }, []);
  const [hoveredSlug, setHoveredSlug] = React.useState<string | null>(null);
  const cardRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const shouldScrollToActiveRef = React.useRef(false);
  const prevActiveSlugRef = React.useRef<string | null>(null);
  const mapCardRef = React.useRef<HTMLDivElement | null>(null);

  // Layout (research: docs/ux/MAP-LIST-RESEARCH-2026-10-10.md). From lg up
  // the results are a split: cards on the left, a sticky map on the right,
  // which the visitor can hide (remembered on the device). Below lg there is
  // no map in the page; a floating button opens it full screen.
  const [windowWidth, setWindowWidth] = React.useState(0);
  React.useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const [mapHidden, setMapHidden] = React.useState(false);
  React.useEffect(() => {
    try {
      setMapHidden(window.localStorage.getItem(MAP_HIDDEN_STORAGE_KEY) === "1");
    } catch {
      // storage blocked: the map stays on
    }
  }, []);
  const toggleMapHidden = React.useCallback(() => {
    setMapHidden((hidden) => {
      try {
        window.localStorage.setItem(MAP_HIDDEN_STORAGE_KEY, hidden ? "0" : "1");
      } catch {
        // storage blocked: the choice lasts for this page only
      }
      return !hidden;
    });
  }, []);
  // No results, no map: an empty country beside "nothing found" said nothing.
  const split = !mapHidden && pageItems.length > 0;


  // maplibre-gl is 1 MB of script: parsing it before the visitor wants the
  // map cost 3.7 s of main thread on a phone (Lighthouse, 2026-09-30). The
  // library loads once the panel is within 400 px of the viewport (desktop:
  // straight away) or when the visitor opens the full-screen map (phones,
  // where the panel is not displayed and never intersects).
  const [mapNearViewport, setMapNearViewport] = React.useState(false);
  // Wait for the window's load event and an idle moment too, so the hero and
  // the first cards paint first.
  const [pageSettled, setPageSettled] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    let idleHandle: number | undefined;
    const settle = () => {
      if (cancelled) return;
      const done = () => {
        if (!cancelled) setPageSettled(true);
      };
      idleHandle =
        typeof window.requestIdleCallback === "function"
          ? window.requestIdleCallback(done, { timeout: 2000 })
          : window.setTimeout(done, 500);
    };
    // On wide screens the map is in the first view and is what the visitor
    // looks at: waiting for every card photo to load (the window's load event,
    // ~5.5 s on /en/albania/durres) left an empty grey box. Start it once the
    // page has hydrated; phones keep waiting for load (see above).
    const wide = window.matchMedia("(min-width: 1024px)").matches;
    if (wide || document.readyState === "complete") settle();
    else window.addEventListener("load", settle, { once: true });
    // Fetch the map library's code in parallel with the rest, so mounting
    // does not start with a 270 kB download.
    if (wide) void import("@/components/catalog/map/PropertiesMap");
    return () => {
      cancelled = true;
      window.removeEventListener("load", settle);
      if (idleHandle !== undefined) {
        if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleHandle);
        window.clearTimeout(idleHandle);
      }
    };
  }, []);
  const showMap = mapNearViewport && pageSettled;
  React.useEffect(() => {
    const el = mapCardRef.current;
    if (!el || mapNearViewport) return;
    if (!("IntersectionObserver" in window)) {
      setMapNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setMapNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mapNearViewport]);
  const previewRef = React.useRef<HTMLDivElement | null>(null);

  // Full-screen map. Opening adds a history entry, so the phone's Back button
  // closes the map instead of leaving the catalogue. `?view=map` (the
  // installed app's Map tab) opens it straight away.
  const [mapExpanded, setMapExpanded] = React.useState(false);
  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("view") !== "map") return;
    setMapExpanded(true);
    setMapNearViewport(true);
  }, []);
  React.useEffect(() => {
    const onPop = () => setMapExpanded(Boolean(window.history.state?.domlivoMap));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const handleMapExpandedChange = React.useCallback((next: boolean) => {
    if (next) {
      window.history.pushState({ ...window.history.state, domlivoMap: true }, "");
      setMapExpanded(true);
      setMapNearViewport(true);
      return;
    }
    if (window.history.state?.domlivoMap) {
      window.history.back();
      return;
    }
    // Opened by `?view=map`: drop the flag so a reload shows the catalogue.
    const url = new URL(window.location.href);
    if (url.searchParams.get("view") === "map") {
      url.searchParams.delete("view");
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }
    setMapExpanded(false);
  }, []);

  // The installed app's tab bar (components/pwa/AppTabBar) opens and closes
  // this map in place rather than reloading the page: it reads the state from
  // `data-catalog-map` on <html> and asks through a window event.
  React.useEffect(() => {
    const root = document.documentElement;
    root.dataset.catalogMap = mapExpanded ? "open" : "closed";
    window.dispatchEvent(new CustomEvent("domlivo:catalog-map", { detail: { open: mapExpanded } }));
  }, [mapExpanded]);
  React.useEffect(() => {
    const onRequest = (ev: Event) => {
      const open = Boolean((ev as CustomEvent<{ open?: boolean }>).detail?.open);
      handleMapExpandedChange(open);
    };
    window.addEventListener("domlivo:catalog-map-request", onRequest);
    return () => {
      window.removeEventListener("domlivo:catalog-map-request", onRequest);
      delete document.documentElement.dataset.catalogMap;
    };
  }, [handleMapExpandedChange]);

  // ── "Show more" state (see PropertyPagination) ─────────────────────────
  const [allItems, setAllItems] = React.useState<PropertyHomes[]>(pageItems);
  const [nextPage, setNextPage] = React.useState(currentPage + 1);
  const [hasMore, setHasMore] = React.useState(currentPage < totalPages);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  // Track the filter key so we reset when filters change (URL changes → SSR re-render → new props)
  const filterKeyRef = React.useRef<string>('');

  // Keep `pageSize` out of the visible URL ("Show more" uses a fixed internal
  // page size). Strip it client-side without a navigation, so inbound links that
  // still carry ?pageSize render clean. loadMore() sends the server-resolved
  // `loadMoreQuery`, page size included, so paging is unaffected.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.has("pageSize")) {
      url.searchParams.delete("pageSize");
      window.history.replaceState(
        window.history.state,
        "",
        `${url.pathname}${url.search}${url.hash}`
      );
    }
  }, []);

  // Reset the appended pages when SSR re-renders with new pageItems (filter change)
  React.useEffect(() => {
    const filterKey = JSON.stringify({ pageItems: pageItems.map(p => p.slug) });
    if (filterKey !== filterKeyRef.current) {
      filterKeyRef.current = filterKey;
      setAllItems(pageItems);
      setNextPage(currentPage + 1);
      setHasMore(currentPage < totalPages);
    }
  }, [pageItems, currentPage, totalPages]);

  const loadMore = React.useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams(loadMoreQuery);
      params.set('page', String(nextPage));
      params.set('locale', locale);
      const res = await fetch(`/api/catalog/properties?${params.toString()}`);
      if (!res.ok) throw new Error('fetch failed');
      const data: { items: PropertyHomes[]; totalCount: number } = await res.json();
      const newItems = data.items ?? [];
      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setAllItems(prev => {
          const existingSlugs = new Set(prev.map(p => p.slug));
          const deduped = newItems.filter(p => !existingSlugs.has(p.slug));
          return [...prev, ...deduped];
        });
        const loadedSoFar = (nextPage) * pageSize;
        setHasMore(loadedSoFar < totalCount);
        setNextPage(n => n + 1);
      }
    } catch {
      // silent — the button stays for another try
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, nextPage, locale, pageSize, totalCount, loadMoreQuery]);


  // Every listing under the filters, not only this page's cards: the page
  // carries 24, the map wants all of them (Durrës: ~650). Fetched once the map
  // mounts, cached at the edge for an hour; the cards on screen are drawn
  // straight away and the rest join when the answer arrives.
  type MapPoint = {
    slug: string
    href: string
    lat: number
    lng: number
    price?: number
    priceUnit?: string
    status?: string
    approximate?: boolean
  }
  const [mapPoints, setMapPoints] = React.useState<MapPoint[]>([])
  React.useEffect(() => {
    // Gated on the panel being near (or the map opened), not on the library:
    // the points download while the library loads, instead of after it. A
    // phone visitor who never opens the map never downloads them.
    if (!mapNearViewport) return
    const controller = new AbortController()
    const params = new URLSearchParams(loadMoreQuery)
    params.delete('page')
    params.delete('pageSize')
    params.delete('sort')
    params.set('locale', locale)
    fetch(`/api/catalog/map-points?${params.toString()}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : { points: [] }))
      .then((data: { points?: MapPoint[] }) => setMapPoints(Array.isArray(data.points) ? data.points : []))
      .catch(() => {
        // The page's own cards are still on the map.
      })
    return () => controller.abort()
  }, [loadMoreQuery, locale, mapNearViewport])

  const mapPointHref = React.useMemo(() => new Map(mapPoints.map((p) => [p.slug, p.href])), [mapPoints])
  // Cards fetched for pins beyond the loaded page (see handleActiveSlugFromMap).
  const [extraCards, setExtraCards] = React.useState<Record<string, PropertyHomes>>({})
  const previewPool = React.useMemo(() => [...allItems, ...Object.values(extraCards)], [allItems, extraCards])

  const handleActiveSlugFromMap = React.useCallback(
    (slug: string) => {
      // Marker click: select marker and show preview, but do NOT scroll list.
      shouldScrollToActiveRef.current = false;
      if (allItems.some((p) => p.slug === slug) || extraCards[slug]) {
        setActiveSlug(slug);
        setPreviewSlug(slug);
        setPending(null);
        return;
      }
      // A pin for a listing beyond the loaded page: fetch its card and show the
      // same preview. Only if that fails does the click open the listing.
      setActiveSlug(slug);
      setPreviewSlug(null);
      setPending(slug);
      fetch(`/api/catalog/card?slug=${encodeURIComponent(slug)}&locale=${locale}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { item?: PropertyHomes | null } | null) => {
          if (data?.item) {
            setExtraCards((prev) => ({ ...prev, [slug]: data.item as PropertyHomes }));
            // Only if the visitor has not picked another pin meanwhile.
            if (pendingSlugRef.current === slug) {
              setPreviewSlug(slug);
              setPending(null);
            }
          } else {
            setPending(null);
            const href = mapPointHref.get(slug);
            if (href) window.location.assign(href);
          }
        })
        .catch(() => {
          const href = mapPointHref.get(slug);
          if (href) window.location.assign(href);
        });
    },
    [setActiveSlug, allItems, extraCards, mapPointHref, locale, setPending]
  );

  // Keep in step with `columnCount`. With the map beside them the cards get
  // 7 of 12 columns from lg: two large cards or three small ones per row.
  const gridClass = cn(
    viewMode === "list" && "flex flex-col gap-3 min-w-0",
    viewMode === "small" &&
      cn(
        "grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4 min-w-0",
        !split && "xl:grid-cols-4"
      ),
    viewMode === "large" &&
      cn(
        "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 min-w-0",
        !split && "lg:grid-cols-3 xl:grid-cols-4"
      )
  );

  React.useEffect(() => {
    if (!activeSlug) return
    // A pin beyond the loaded page is active while its card is being fetched.
    if (mapPointHref.has(activeSlug) && !previewPool.some((p) => p.slug === activeSlug)) return
    const activeItem = previewPool.find((p) => p.slug === activeSlug)
    if (!activeItem) {
      setActiveSlug(null)
      return
    }

    const lat = activeItem.coordinates?.lat
    const lng = activeItem.coordinates?.lng
    const hasValidCoords =
      typeof lat === 'number' &&
      Number.isFinite(lat) &&
      typeof lng === 'number' &&
      Number.isFinite(lng)

    if (!hasValidCoords) setActiveSlug(null)
  }, [activeSlug, previewPool, mapPointHref])

  React.useEffect(() => {
    if (activeSlug == null) {
      shouldScrollToActiveRef.current = false
    }
  }, [activeSlug])

  React.useEffect(() => {
    if (!previewSlug) return
    const exists = previewPool.some((p) => p.slug === previewSlug)
    if (!exists) setPreviewSlug(null)
  }, [previewSlug, previewPool])

  React.useEffect(() => {
    const onPointerDown = (ev: PointerEvent) => {
      if (!previewSlug) return
      const target = ev.target as Node | null
      if (!target) return
      if (previewRef.current?.contains(target)) return
      if (!mapCardRef.current?.contains(target)) return
      setPreviewSlug(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [previewSlug])

  React.useEffect(() => {
    if (!shouldScrollToActiveRef.current) return
    if (!activeSlug) return
    if (prevActiveSlugRef.current === activeSlug) return
    const activeExists = allItems.some((p) => p.slug === activeSlug)
    if (!activeExists) {
      shouldScrollToActiveRef.current = false
      return
    }

    const el = cardRefs.current[activeSlug]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    shouldScrollToActiveRef.current = false
    prevActiveSlugRef.current = activeSlug
  }, [activeSlug, allItems])

  React.useEffect(() => {
    prevActiveSlugRef.current = activeSlug
  }, [activeSlug])

  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    const activeItem = activeSlug ? allItems.find((p) => p.slug === activeSlug) : null
    const lat = activeItem?.coordinates?.lat
    const lng = activeItem?.coordinates?.lng
    const activeHasCoords =
      typeof lat === 'number' && Number.isFinite(lat) && typeof lng === 'number' && Number.isFinite(lng)

    console.log('[CatalogMap][debug]', {
      allItemsCount: allItems.length,
      activeSlug,
      activeHasCoords,
    })
  }, [allItems, activeSlug])

  const mapItems = React.useMemo(() => {
    const loaded = allItems.map((p) => ({
      slug: p.slug,
      price: p.price,
      currency: p.currency,
      rate: p.rate,
      status: p.status,
      coordinates: p.coordinates,
      locationPrecision: p.locationPrecision,
      // Cards in the list get price pills; the rest of the filter is dots.
      pill: true,
    }))
    const seen = new Set(loaded.map((p) => p.slug))
    const rest = mapPoints
      .filter((p) => !seen.has(p.slug))
      .map((p) => ({
        slug: p.slug,
        // A per-m² rate is not a total; leave the pin without a price rather
        // than print "€1,800" on a whole building.
        price: p.priceUnit === 'per-sqm' ? undefined : p.price,
        currency: 'EUR',
        status: p.status,
        coordinates: { lat: p.lat, lng: p.lng },
        locationPrecision: p.approximate ? ('approximate' as const) : ('exact' as const),
        pill: false,
      }))
    return [...loaded, ...rest]
  }, [allItems, mapPoints])

  const columns = columnCount(viewMode, windowWidth, split);
  const composedItems = React.useMemo(
    () => composeCatalogFlowItems({ pageItems: allItems, banners, slots: getBannerSlots(columns) }),
    [columns, allItems, banners]
  );

  const previewItem = React.useMemo(
    () => (previewSlug ? previewPool.find((p) => p.slug === previewSlug) ?? null : null),
    [previewSlug, previewPool]
  )

  const previewHref = React.useMemo(() => {
    if (!previewItem) return '#'
    return previewItem._href ?? `/${locale}/property/${previewItem.slug}`
  }, [previewItem, locale])

  // The panel sticks under the header and the compact filter pill and fills
  // the rest of the window; its size is set in CSS before the map loads (no
  // shift). A fixed offset, not the filter bar's live height: the bar animates
  // between the pill and the full form, and following it resized the map on
  // every frame of that animation, which flickered like a re-render.
  const panelTop = HEADER_OFFSET_PX + COMPACT_FILTER_BAR_PX + 12;

  return (
    <>
      {/* Filters: sticky below fixed header (z-50); z-40 above property card overlays (z-30). Background lives on PropertySearchBar only — no second white shell. */}
      <div
        className={cn(
          "sticky z-40 min-w-0 [contain:layout]",
          "top-[calc(env(safe-area-inset-top,0px)+72px)] md:top-[84px]"
        )}
      >
        <PropertySearchBar
          {...filterProps}
          getCurrentView={getCurrentView}
        />
      </div>
      {afterFilters ? <div className="min-w-0 pb-5 md:pb-6">{afterFilters}</div> : null}
      <div className="min-w-0 min-h-0 pb-12 sm:pb-16 md:pb-20">
        <div className={cn(split && "lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start")}>
          <div className={cn("min-w-0", split && "lg:col-span-7")}>
            {allItems.length > 0 ? (
              <div className="mb-3 hidden justify-end lg:flex">
                <button
                  type="button"
                  onClick={toggleMapHidden}
                  aria-pressed={!mapHidden}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-dark/15 px-4 text-sm font-medium text-dark hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
                >
                  <MapIcon />
                  {mapHidden ? tMap("showMap") : tMap("hideMap")}
                </button>
              </div>
            ) : null}
            <div className={gridClass}>
              {composedItems.map((entry) => {
                if (entry.kind === "banner") {
                  return (
                    <div key={entry.key} className="min-w-0 col-span-full">
                      <PropertyCatalogBannerCard banner={entry.banner} />
                    </div>
                  );
                }
                const item = entry.item;
                const isActive = activeSlug === item.slug;
                return (
                  <div
                    key={entry.key}
                    className={cn("min-w-0", viewMode !== "list" && "h-full", isActive && "rounded-2xl ring-2 ring-primary/40")}
                    ref={(el) => {
                      if (!item.slug) return;
                      cardRefs.current[item.slug] = el;
                    }}
                    // The card's pin lights up on the map while the pointer is on it.
                    onMouseEnter={() => setHoveredSlug(item.slug)}
                    onMouseLeave={() => setHoveredSlug((s) => (s === item.slug ? null : s))}
                  >
                    {/* Every card in a row takes the row's height and keeps its
                        button on the bottom edge, even when a listing has no price,
                        no rooms or no area to show (partner projects often don't). */}
                    <PropertyCard item={item} locale={locale} view={viewMode} fillHeight={viewMode !== "list"} />
                  </div>
                );
              })}
            </div>
            {allItems.length === 0 ? (
              <CatalogEmptyState locale={locale} />
            ) : (
              <>
                {/* One control: a link to the next page for crawlers, an in-place
                    append for people. See PropertyPagination. */}
                {totalPages > 1 && (
                  <PropertyPagination
                    currentPage={currentPage}
                    nextPage={nextPage}
                    hasMore={hasMore}
                    isLoading={isLoadingMore}
                    onShowMore={loadMore}
                    from={(currentPage - 1) * pageSize + 1}
                    to={Math.min(totalCount, (currentPage - 1) * pageSize + allItems.length)}
                    total={totalCount}
                    serverSearch={serverSearch}
                  />
                )}
              </>
            )}
          </div>

          {/* The map: a sticky panel beside the cards from lg up, full screen
              when expanded (the only way to it below lg). One instance, so the
              camera and the loaded points survive switching between the two. */}
          <aside
            className={cn(
              mapExpanded ? "block" : split ? "hidden lg:block" : "hidden",
              // The sticky aside is its own stacking context: without a z-index
              // of its own the expanded map inside it stayed under the header
              // (z-50) and the card controls on desktop, its × unclickable.
              mapExpanded && "z-[55]",
              split && "lg:col-span-5 lg:sticky lg:top-[var(--map-top)] lg:h-[calc(100dvh-var(--map-top)-16px)] lg:min-h-[420px]"
            )}
            style={{ "--map-top": `${panelTop}px` } as React.CSSProperties}
          >
            <div
              ref={mapCardRef}
              className={cn(
                mapExpanded
                  ? // Above the installed app's tab bar, which stays usable; below
                    // dialogs (z-60), so an enquiry from the map opens on top.
                    "fixed inset-x-0 top-0 bottom-[var(--app-tabbar-offset,0px)] z-[55] bg-white dark:bg-black pt-[env(safe-area-inset-top,0px)] pb-[var(--app-bottom-inset,0px)]"
                  : "relative h-full"
              )}
            >
              {showMap ? (
                <PropertiesMap
                  items={mapItems}
                  activeSlug={activeSlug}
                  highlightSlug={hoveredSlug}
                  onActiveSlugChange={handleActiveSlugFromMap}
                  mapHeightClassName="h-full"
                  className="h-full"
                  selectedCitySlug={filterProps.initialCity || undefined}
                  selectedDistrictSlug={filterProps.initialDistrict || undefined}
                  selectedDealType={filterProps.initialDealType || undefined}
                  expanded={mapExpanded}
                  onExpandedChange={handleMapExpandedChange}
                />
              ) : (
                <div className="absolute inset-0 rounded-2xl bg-dark/5 dark:bg-white/10" aria-hidden />
              )}
              {!previewItem && pendingSlug ? (
                <MapListingSheet
                  item={null}
                  href="#"
                  locale={locale}
                  variant={mapExpanded ? "sheet" : "panel"}
                  onClose={() => setPending(null)}
                />
              ) : null}
              {previewItem ? (
                // `contents`: the ref only marks "inside the preview" for the
                // outside-tap handler; the sheet positions itself.
                <div ref={previewRef} className="contents">
                  <MapListingSheet
                    item={previewItem}
                    href={previewHref}
                    locale={locale}
                    variant={mapExpanded ? "sheet" : "panel"}
                    onClose={() => setPreviewSlug(null)}
                  />
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </div>

      {/* Phones and tablets (and desktop with the map hidden): a floating
          button opens the full-screen map. */}
      {!mapExpanded && allItems.length > 0 ? (
        <button
          type="button"
          onClick={() => handleMapExpandedChange(true)}
          className={cn(
            "fixed left-1/2 z-[45] inline-flex h-11 -translate-x-1/2 items-center gap-2 rounded-full bg-dark px-5 text-sm font-semibold text-white shadow-lg hover:bg-primary dark:bg-white dark:text-dark",
            // Above the listing contact bar on phones (it pads the page by its
            // own height) and the installed app's tab bar.
            "bottom-[calc(var(--app-tabbar-offset,0px)+max(var(--app-bottom-inset,0px),var(--mobile-sticky-bar-height,0px))+12px)]",
            split && "lg:hidden",
            // The installed app has a Map tab for this.
            "[@media(display-mode:standalone)]:hidden [[data-pwa-standalone]_&]:hidden"
          )}
        >
          <MapIcon />
          {tMap("mapButton", { count: totalCount })}
        </button>
      ) : null}
    </>
  );
}

function MapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}

function MapUnavailable() {
  const t = useTranslations("Shared.map");
  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-dark/5 p-6 text-center text-sm text-dark/70 dark:bg-white/10 dark:text-white/70">
      {t("offline")}
    </div>
  );
}
