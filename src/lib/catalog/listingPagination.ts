/**
 * Catalogue pages and the links between them — one module for the page index
 * the listing renders and for the click-depth check that proves every listing
 * is reachable (`scripts/check-listing-click-depth.ts`, audit M-2).
 *
 * Why every page links to every page: with 24 cards a page, Durrës (500+
 * listings) runs past twenty pages. A "show more" chain alone puts page 21 at
 * twenty clicks from the city hub and its listings deeper still. The compact
 * page index under the button links all pages from each page, so any listing
 * is at most two clicks from the hub it belongs to: hub → page N → listing.
 *
 * No imports: the script loads this file with Node's type stripping, which
 * resolves neither `@/` aliases nor extensionless paths.
 */

/** Cards per catalogue page (`PropertiesListing` default; the only size links build). */
export const CATALOG_PAGE_SIZE = 24;

export function catalogTotalPages(totalItems: number, pageSize: number = CATALOG_PAGE_SIZE): number {
  if (!Number.isFinite(totalItems) || totalItems <= 0) return 1;
  return Math.max(1, Math.ceil(totalItems / Math.max(1, pageSize)));
}

/** 1-based page that shows the item at 0-based `position`. */
export function catalogPageOf(position: number, pageSize: number = CATALOG_PAGE_SIZE): number {
  return Math.floor(Math.max(0, position) / Math.max(1, pageSize)) + 1;
}

export type CatalogPageIndexEntry = { page: number; current: boolean };

/**
 * The page index a catalogue page renders: every page from 1 to the last, the
 * one being shown marked `current` (not a link). Empty when there is one page.
 */
export function catalogPageIndex(currentPage: number, totalPages: number): CatalogPageIndexEntry[] {
  const total = Math.max(1, Math.floor(totalPages));
  if (total <= 1) return [];
  const current = Math.min(Math.max(1, Math.floor(currentPage) || 1), total);
  return Array.from({ length: total }, (_, i) => ({ page: i + 1, current: i + 1 === current }));
}

/** Pages a catalogue page links to: the page index minus the page itself. */
export function catalogPageLinkTargets(currentPage: number, totalPages: number): number[] {
  return catalogPageIndex(currentPage, totalPages)
    .filter((e) => !e.current)
    .map((e) => e.page);
}

/**
 * One paged catalogue (a city, a district, a facet, `/sale`): the listings it
 * pages through in display order, the ones linked from every page regardless
 * (catalogue banners, kept out of the paged list), and the catalogues its
 * first page links to (a city's districts).
 */
export type CatalogueHub = {
  id: string;
  listingIds: readonly string[];
  pinnedListingIds?: readonly string[];
  childHubIds?: readonly string[];
};

/**
 * Click depth of every listing reachable from `rootHubId`'s first page, over
 * the links the catalogue renders: the page index on each page, the cards on
 * it, the pinned banners, and the child catalogues from page one. Breadth
 * first, so each depth is the shortest path. Listings not reachable are absent.
 */
export function catalogueClickDepths(
  rootHubId: string,
  hubs: readonly CatalogueHub[],
  pageSize: number = CATALOG_PAGE_SIZE,
): Map<string, number> {
  const byId = new Map(hubs.map((h) => [h.id, h]));
  const pageDepth = new Map<string, number>();
  const listingDepth = new Map<string, number>();
  const queue: Array<{ hub: CatalogueHub; page: number; depth: number }> = [];

  const visitPage = (hubId: string, page: number, depth: number) => {
    const hub = byId.get(hubId);
    if (!hub) return;
    const key = `${hubId}\u0000${page}`;
    if (pageDepth.has(key)) return;
    pageDepth.set(key, depth);
    queue.push({ hub, page, depth });
  };

  visitPage(rootHubId, 1, 0);
  for (let i = 0; i < queue.length; i++) {
    const { hub, page, depth } = queue[i];
    const totalPages = catalogTotalPages(hub.listingIds.length, pageSize);
    const start = (page - 1) * pageSize;
    const onPage = [...hub.listingIds.slice(start, start + pageSize), ...(hub.pinnedListingIds ?? [])];
    for (const id of onPage) {
      if (!listingDepth.has(id)) listingDepth.set(id, depth + 1);
    }
    for (const target of catalogPageLinkTargets(page, totalPages)) visitPage(hub.id, target, depth + 1);
    if (page === 1) for (const child of hub.childHubIds ?? []) visitPage(child, 1, depth + 1);
  }
  return listingDepth;
}
